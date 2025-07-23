# Skeleton Loading Implementation

Implementasi skeleton loading untuk semua halaman dalam aplikasi ini untuk
memberikan pengalaman pengguna yang lebih baik saat memuat konten.

## Komponen Skeleton yang Tersedia

### 1. Page Skeletons (`/components/ui/page-skeletons.tsx`)

- **DashboardSkeleton**: Skeleton untuk halaman dashboard dengan sidebar dan
  card content
- **TablePageSkeleton**: Skeleton untuk halaman dengan tabel data (prospects,
  call logs, dll)
- **FormPageSkeleton**: Skeleton untuk halaman form dan settings
- **LoginSkeleton**: Skeleton untuk halaman login
- **CardGridSkeleton**: Skeleton untuk halaman dengan layout card grid

### 2. Component Skeletons (`/components/ui/component-skeletons.tsx`)

- **SidebarSkeleton**: Skeleton untuk sidebar navigation
- **BreadcrumbSkeleton**: Skeleton untuk breadcrumb navigation
- **HeaderSkeleton**: Skeleton untuk header dengan trigger dan breadcrumb

### 3. Loading Skeletons (`/components/ui/loading-skeletons.tsx`)

- **ModalSkeleton**: Skeleton untuk modal/dialog loading
- **InlineLoadingSkeleton**: Skeleton untuk loading state dalam komponen
- **CardListSkeleton**: Skeleton untuk daftar card dengan jumlah yang dapat
  disesuaikan

## Hooks untuk Loading State

### 1. Basic Loading Hooks (`/hooks/use-page-loading.ts`)

```typescript
// Loading dengan delay tertentu
const isLoading = usePageLoading(800) // default 800ms

// Loading untuk komponen dengan delay lebih pendek
const isLoading = useComponentLoading(500) // default 500ms

// Loading berdasarkan kondisi data
const isLoading = useDataLoading(data, 500)

// Loading dengan multiple conditions
const isLoading = useMultipleLoading([loading1, loading2], 300)
```

## Page Wrapper

### 1. Komponen PageWrapper (`/components/ui/page-wrapper.tsx`)

```typescript
<PageWrapper
  pageType='dashboard'
  loadingDelay={800}>
  <YourPageContent />
</PageWrapper>
```

### 2. HOC withPageSkeleton

```typescript
export default withPageSkeleton(YourPage, 'table', 1000)
```

## Implementasi di Halaman

### Contoh 1: Halaman Dashboard

```typescript
"use client";

import { DashboardSkeleton } from "@/components/ui/page-skeletons";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function DashboardPage() {
  const isLoading = usePageLoading(1000);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    // Your page content
  );
}
```

### Contoh 2: Halaman dengan Data Loading

```typescript
"use client";

import { TablePageSkeleton } from "@/components/ui/page-skeletons";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function ProspectsPage() {
  const isPageLoading = usePageLoading(1000);
  const { data, loading } = useYourDataHook();

  if (isPageLoading || loading) {
    return <TablePageSkeleton />;
  }

  return (
    // Your page content
  );
}
```

### Contoh 3: Menggunakan PageWrapper

```typescript
'use client'

import { PageWrapper } from '@/components/ui/page-wrapper'

export default function SettingsPage() {
  const { settings, loading } = useSettings()

  return (
    <PageWrapper
      pageType='form'
      isLoading={loading}>
      {/* Your settings content */}
    </PageWrapper>
  )
}
```

## Halaman yang Sudah Diimplementasi

✅ **Dashboard** (`/dashboard`) - DashboardSkeleton ✅ **Login** (`/login`) -
LoginSkeleton  
✅ **Prospects** (`/telemarketing/prospects`) - TablePageSkeleton ✅ **Phone
Calls** (`/telemarketing/calls`) - CardGridSkeleton ✅ **Scripts**
(`/telemarketing/scripts`) - CardGridSkeleton ✅ **Call Logs**
(`/telemarketing/call-logs`) - TablePageSkeleton ✅ **Settings Pages** -
FormPageSkeleton:

- Application Settings (`/settings/application`)
- Firebase Settings (`/settings/firebase`)
- Roles & Permissions (`/settings/roles`)
- Telemarketing Settings (`/settings/telemarketing`) ✅ **Create Estimation**
  (`/estimations/create`) - FormPageSkeleton ✅ **Setup Page** (`/setup`) -
  Custom skeleton ✅ **Initialize Page** (`/initialize`) - Custom skeleton ✅
  **Rich Editor Demo** (`/rich-editor-demo`) - Custom skeleton

## Best Practices

1. **Delay Loading**: Gunakan delay 800-1000ms untuk halaman utama, 500-600ms
   untuk modal/komponen
2. **Match Content**: Pastikan skeleton mirip dengan layout konten sebenarnya
3. **Progressive Loading**: Tampilkan skeleton hingga semua data penting termuat
4. **Consistent Design**: Gunakan skeleton yang konsisten untuk tipe halaman
   yang sama
5. **Performance**: Jangan terlalu banyak animasi skeleton yang dapat
   mempengaruhi performa

## Kustomisasi

Untuk membuat skeleton custom, gunakan komponen `Skeleton` dasar:

```typescript
import { Skeleton } from '@/components/ui/skeleton'

function CustomSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-6 w-32' />
      <Skeleton className='h-4 w-full' />
      <Skeleton className='h-10 w-24' />
    </div>
  )
}
```

## Timeline Loading yang Direkomendasikan

- **Login/Auth**: 600-800ms
- **Dashboard**: 800-1000ms
- **Data Tables**: 1000-1200ms
- **Forms/Settings**: 600-800ms
- **Modal/Dialog**: 300-500ms
- **Components**: 300-500ms
