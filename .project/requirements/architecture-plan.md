# Architecture Planning Document

## System Architecture Overview

### Design Philosophy

**Portability First**: Every architectural decision prioritizes **easy migration** between platforms while maintaining performance and developer experience. The system uses abstraction layers to decouple core application logic from deployment-specific implementations.

**Modern React Patterns**: Leverage React 19's new capabilities while maintaining backward compatibility and preparing for future features like Server Components.

**Type-Safe by Design**: Comprehensive TypeScript coverage with strict configuration ensures reliability and excellent developer experience.

## Layered Architecture

### 1. Presentation Layer (Frontend)
```
┌─────────────────────────────────────┐
│           React 19 App              │
├─────────────────────────────────────┤
│  Components (UI + Feature)          │
│  ├── Atomic UI Components           │
│  ├── Feature Components             │
│  └── Page Components                │
├─────────────────────────────────────┤
│  State Management                   │
│  ├── React 19 Built-in Hooks        │
│  ├── TanStack Query (Server State)  │
│  └── Custom Hooks (Local State)     │
├─────────────────────────────────────┤
│  Routing & Navigation               │
│  └── React Router v7 (Type-Safe)    │
└─────────────────────────────────────┘
```

### 2. Abstraction Layer (Platform Independence)
```
┌─────────────────────────────────────┐
│        API Client Layer             │
├─────────────────────────────────────┤
│  HTTP Client (Fetch + Type Safety)  │
│  ├── Request/Response Types          │
│  ├── Error Handling                 │
│  └── Authentication Interceptors    │
├─────────────────────────────────────┤
│  Platform Abstraction Services      │
│  ├── Environment Variables          │
│  ├── Storage Service                │
│  └── Analytics Service              │
└─────────────────────────────────────┘
```

### 3. Business Logic Layer
```
┌─────────────────────────────────────┐
│       Application Services          │
├─────────────────────────────────────┤
│  Domain Logic                       │
│  ├── User Management                │
│  ├── Authentication/Authorization   │
│  └── Business Rules                 │
├─────────────────────────────────────┤
│  Data Transformation                │
│  ├── Input Validation               │
│  ├── Data Serialization             │
│  └── Format Conversion              │
└─────────────────────────────────────┘
```

### 4. Infrastructure Layer (Deployment)
```
┌─────────────────────────────────────┐
│     Cloudflare Workers (Primary)    │
├─────────────────────────────────────┤
│  Alternative Platforms              │
│  ├── Vercel Functions               │
│  ├── Netlify Functions              │
│  └── AWS Lambda                     │
├─────────────────────────────────────┤
│  Database Layer                     │
│  ├── Cloudflare D1 (SQLite)         │
│  ├── PlanetScale (MySQL)            │
│  └── Supabase (PostgreSQL)          │
└─────────────────────────────────────┘
```

## Component Architecture

### Atomic Design Principles

#### 1. Atoms (Base UI Components)
```typescript
// src/components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'destructive'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  )
}
```

#### 2. Molecules (Composed Components)
```typescript
// src/components/ui/form-field.tsx
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={cn(required && "after:content-['*'] after:text-red-500")}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
```

#### 3. Organisms (Feature Components)
```typescript
// src/components/feature/user-profile-form.tsx
interface UserProfileFormProps {
  user: User
  onSubmit: (data: UserUpdateData) => Promise<void>
}

export function UserProfileForm({ user, onSubmit }: UserProfileFormProps) {
  const [state, formAction] = useActionState(updateUserAction, {
    success: false,
    errors: {}
  })

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Full Name" required error={state.errors.name}>
        <Input 
          name="name" 
          defaultValue={user.name}
          placeholder="Enter your full name"
        />
      </FormField>
      
      <FormField label="Email" required error={state.errors.email}>
        <Input 
          name="email" 
          type="email"
          defaultValue={user.email}
          placeholder="Enter your email"
        />
      </FormField>

      <SubmitButton>Update Profile</SubmitButton>
    </form>
  )
}
```

### React 19 Integration Patterns

#### 1. Server Actions with useActionState
```typescript
// src/lib/actions/user-actions.ts
async function updateUserAction(
  prevState: ActionState, 
  formData: FormData
): Promise<ActionState> {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string
    }

    // Validation
    const result = userUpdateSchema.safeParse(data)
    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors
      }
    }

    // API call through abstraction layer
    await apiClient.users.update(result.data)

    return { success: true, errors: {} }
  } catch (error) {
    return {
      success: false,
      errors: { _form: [getErrorMessage(error)] }
    }
  }
}
```

#### 2. Optimistic Updates with useOptimistic
```typescript
// src/hooks/use-optimistic-todos.ts
export function useOptimisticTodos(initialTodos: Todo[]) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state: Todo[], optimisticTodo: Todo) => [
      ...state,
      { ...optimisticTodo, pending: true }
    ]
  )

  const addTodo = async (todoData: CreateTodoData) => {
    const tempTodo: Todo = {
      id: crypto.randomUUID(),
      ...todoData,
      createdAt: new Date().toISOString(),
      completed: false
    }

    // Optimistic update
    addOptimisticTodo(tempTodo)

    try {
      // Actual API call
      await apiClient.todos.create(todoData)
    } catch (error) {
      // Optimistic update will revert automatically
      toast.error('Failed to create todo. Please try again.')
      throw error
    }
  }

  return { optimisticTodos, addTodo }
}
```

#### 3. Form Status with useFormStatus
```typescript
// src/components/ui/submit-button.tsx
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending, data } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      loading={pending}
      {...props}
    >
      {children}
    </Button>
  )
}
```

## API Layer Architecture

### Type-Safe API Client
```typescript
// src/lib/api/client.ts
interface ApiConfig {
  baseUrl: string
  authToken?: string
}

class ApiClient {
  constructor(private config: ApiConfig) {}

  // Generic request method with type safety
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && {
          Authorization: `Bearer ${this.config.authToken}`
        }),
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }

    return response.json()
  }

  // Resource-specific methods
  users = {
    get: (id: string): Promise<User> => 
      this.request(`/api/users/${id}`),
    
    update: (id: string, data: UserUpdateData): Promise<User> =>
      this.request(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    list: (params?: UserListParams): Promise<PaginatedResponse<User>> =>
      this.request(`/api/users${toQueryString(params)}`)
  }

  todos = {
    list: (): Promise<Todo[]> => 
      this.request('/api/todos'),
    
    create: (data: CreateTodoData): Promise<Todo> =>
      this.request('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
}
```

### Platform Abstraction Services

#### Environment Service
```typescript
// src/lib/services/environment.ts
interface EnvironmentConfig {
  apiUrl: string
  auth0Domain: string
  auth0ClientId: string
  auth0Audience: string
  enableAnalytics: boolean
}

class EnvironmentService {
  private config: EnvironmentConfig

  constructor() {
    // Works across Vite, Next.js, and other platforms
    this.config = {
      apiUrl: this.getEnvVar('VITE_API_URL'),
      auth0Domain: this.getEnvVar('VITE_AUTH0_DOMAIN'),
      auth0ClientId: this.getEnvVar('VITE_AUTH0_CLIENT_ID'),
      auth0Audience: this.getEnvVar('VITE_AUTH0_AUDIENCE'),
      enableAnalytics: this.getEnvVar('VITE_ENABLE_ANALYTICS') === 'true'
    }
  }

  private getEnvVar(key: string): string {
    // Support different environment variable patterns
    const value = 
      import.meta.env?.[key] || // Vite
      process.env[key] ||       // Node.js/Next.js
      globalThis[key]           // Cloudflare Workers

    if (!value) {
      throw new Error(`Environment variable ${key} is required`)
    }

    return value
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key]
  }
}

export const env = new EnvironmentService()
```

#### Storage Service
```typescript
// src/lib/services/storage.ts
interface StorageProvider {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

class BrowserStorageProvider implements StorageProvider {
  async get(key: string) {
    return localStorage.getItem(key)
  }

  async set(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  async remove(key: string) {
    localStorage.removeItem(key)
  }
}

class WorkerKVStorageProvider implements StorageProvider {
  constructor(private kv: KVNamespace) {}

  async get(key: string) {
    return this.kv.get(key)
  }

  async set(key: string, value: string) {
    await this.kv.put(key, value)
  }

  async remove(key: string) {
    await this.kv.delete(key)
  }
}

export class StorageService {
  constructor(private provider: StorageProvider) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.provider.get(key)
    return value ? JSON.parse(value) : null
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.provider.set(key, JSON.stringify(value))
  }

  async remove(key: string): Promise<void> {
    await this.provider.remove(key)
  }
}
```

## State Management Architecture

### 1. Local Component State (React 19 Built-ins)
```typescript
// Simple local state with useState
function UserPreferences() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [language, setLanguage] = useState('en')

  return (
    <div>
      <ThemeToggle value={theme} onChange={setTheme} />
      <LanguageSelect value={language} onChange={setLanguage} />
    </div>
  )
}
```

### 2. Complex Local State (useReducer)
```typescript
// Complex state with useReducer
interface CartState {
  items: CartItem[]
  total: number
  discounts: Discount[]
}

type CartAction = 
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'APPLY_DISCOUNT'; discount: Discount }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.item],
        total: calculateTotal([...state.items, action.item], state.discounts)
      }
    // ... other cases
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialCartState)
  
  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', item })
  }, [])

  return { state, addItem, /* other actions */ }
}
```

### 3. Server State (TanStack Query)
```typescript
// src/lib/queries/user-queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.users.get(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateData }) =>
      apiClient.users.update(id, data),
    
    onSuccess: (updatedUser) => {
      // Update cache
      queryClient.setQueryData(['user', updatedUser.id], updatedUser)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })
}
```

### 4. Global State (Context + useReducer)
```typescript
// src/contexts/app-context.tsx
interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  sidebar: { isOpen: boolean }
}

type AppAction = 
  | { type: 'SET_USER'; user: User | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'TOGGLE_SIDEBAR' }

const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
}>({} as any)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}
```

## Authentication Architecture

### Auth0 Integration with Abstraction
```typescript
// src/lib/auth/auth-provider.tsx
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user: auth0User,
    isLoading: auth0Loading,
    isAuthenticated,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    error: auth0Error
  } = useAuth0()

  // Transform Auth0 user to application user type
  const user = useMemo(() => 
    auth0User ? transformAuth0User(auth0User) : null,
    [auth0User]
  )

  const login = useCallback(async () => {
    await loginWithRedirect()
  }, [loginWithRedirect])

  const logout = useCallback(async () => {
    await auth0Logout({ logoutParams: { returnTo: window.location.origin } })
  }, [auth0Logout])

  const getAccessToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently()
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }, [getAccessTokenSilently])

  const contextValue: AuthContextValue = {
    user,
    isLoading: auth0Loading,
    isAuthenticated,
    error: auth0Error?.message || null,
    login,
    logout,
    getAccessToken
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
```

## Error Handling Architecture

### Error Boundary System
```typescript
// src/components/error-boundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to monitoring service
    errorService.captureException(error, {
      contexts: { react: errorInfo }
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      )
    }

    return this.props.children
  }
}
```

### Error Service Abstraction
```typescript
// src/lib/services/error-service.ts
interface ErrorContext {
  user?: User
  url?: string
  userAgent?: string
  timestamp?: string
  additional?: Record<string, any>
}

interface ErrorService {
  captureException(error: Error, context?: ErrorContext): void
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void
}

class SentryErrorService implements ErrorService {
  captureException(error: Error, context?: ErrorContext) {
    // Sentry implementation
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    // Sentry implementation
  }
}

class ConsoleErrorService implements ErrorService {
  captureException(error: Error, context?: ErrorContext) {
    console.error('Error captured:', error, context)
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error') {
    console[level](message)
  }
}

// Factory for error service based on environment
export const errorService: ErrorService = env.get('enableErrorTracking')
  ? new SentryErrorService()
  : new ConsoleErrorService()
```

## Routing Architecture

### Type-Safe Routing with React Router
```typescript
// src/lib/router/routes.ts
export const routes = {
  home: '/',
  about: '/about',
  login: '/login',
  dashboard: '/dashboard',
  profile: '/profile',
  settings: '/settings',
  user: (id: string) => `/users/${id}`,
  userEdit: (id: string) => `/users/${id}/edit`,
} as const

export type RouteKeys = keyof typeof routes
export type RouteParams<T extends RouteKeys> = 
  typeof routes[T] extends (...args: infer P) => string ? P : never

// Type-safe navigation hook
export function useTypedNavigate() {
  const navigate = useNavigate()
  
  return useCallback(<T extends RouteKeys>(
    route: T,
    ...params: RouteParams<T>
  ) => {
    const path = typeof routes[route] === 'function' 
      ? (routes[route] as any)(...params)
      : routes[route]
    
    navigate(path)
  }, [navigate])
}
```

This architecture provides a solid foundation for building scalable, maintainable web applications with maximum portability and modern development practices.