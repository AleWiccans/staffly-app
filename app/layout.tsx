import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './components/CurrencySelector'

export const metadata = {
  title: 'Staffly — Tu biblioteca musical digital',
  description: 'Descubre, escucha y descarga partituras de alta calidad.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CurrencyProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#111118',
                  color: '#f0ede6',
                  border: '0.5px solid rgba(240,237,230,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'DM Sans, sans-serif',
                },
              }}
            />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}