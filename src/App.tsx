import { useState, useEffect } from 'react'
import { Card, CardContent, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Skeleton } from './components/ui/skeleton'
import { AlertCircle, Calendar, Hash, Package, RefreshCw } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import Papa from 'papaparse'

interface Product {
  name: string
  discount: string
  validUntil: string
  eanCode: string
  image?: string
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const SPREADSHEET_ID = '1iCp5Pf5CPu_sbv8K3MQhkpOB51gvYuB7iytoZS8BM4A'
  const SHEET_GID = '517842932'
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`

  const DEMO_DATA: Product[] = [
    {
      name: "Nutella 750g Glas",
      discount: "-2,50 €",
      validUntil: "2024-02-15",
      eanCode: "8000500037508",
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=200&fit=crop"
    },
    {
      name: "Coca Cola Zero 6x1,5L",
      discount: "-1,99 €", 
      validUntil: "2024-02-20",
      eanCode: "5449000000996",
      image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=200&fit=crop"
    },
    {
      name: "Milka Schokolade 100g",
      discount: "-0,75 €",
      validUntil: "2024-02-10",
      eanCode: "7622210951052",
      image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&h=200&fit=crop"
    },
    {
      name: "Haribo Goldbären 200g",
      discount: "-0,50 €",
      validUntil: "2024-02-12",
      eanCode: "4001686301081",
      image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=300&h=200&fit=crop"
    },
    {
      name: "Red Bull Energy Drink 250ml",
      discount: "-0,30 €",
      validUntil: "2024-02-18",
      eanCode: "9002490100059",
      image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=200&fit=crop"
    },
    {
      name: "Knorr Fix Spaghetti Bolognese",
      discount: "-0,25 €",
      validUntil: "2024-02-25",
      eanCode: "8712566401234",
      image: "https://images.unsplash.com/photo-1551462099-fcb0e0d9db95?w=300&h=200&fit=crop"
    }
  ]

  const generateBarcode = (eanCode: string, elementId: string) => {
    try {
      // Clean the EAN code and check if it's valid
      const cleanEAN = eanCode.replace(/\D/g, '')
      if (cleanEAN.length === 13 && /^\d+$/.test(cleanEAN)) {
        const canvas = document.getElementById(elementId) as HTMLCanvasElement
        if (canvas) {
          JsBarcode(canvas, cleanEAN, {
            format: 'EAN13',
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 12,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000'
          })
        }
      }
    } catch (err) {
      console.error('Error generating barcode:', err)
    }
  }

  const fetchSpreadsheetData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // First try the direct URL
      let response = await fetch(CSV_URL)
      
      // If that fails, try with CORS proxy
      if (!response.ok) {
        response = await fetch(`https://corsproxy.io/?${encodeURIComponent(CSV_URL)}`)
      }
      
      // If still failing, try alternative CORS proxy
      if (!response.ok) {
        response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(CSV_URL)}`)
        if (response.ok) {
          const data = await response.json()
          response = new Response(data.contents)
        }
      }
      
      if (!response.ok) {
        throw new Error('Spreadsheet access restricted - using demo data')
      }
      
      const csvText = await response.text()
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as string[][]
          const productData: Product[] = []
          
          // Skip header row and process data
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row && row.length > 6) {
              const product: Product = {
                name: row[1] || '', // Column B
                discount: row[2] || '', // Column C
                validUntil: row[5] || '', // Column F
                eanCode: row[6] || '', // Column G
                image: row[7] || '' // Column H
              }
              
              // Only add products with essential data
              if (product.name && product.discount && product.eanCode) {
                productData.push(product)
              }
            }
          }
          
          // Use demo data if no valid products found
          if (productData.length === 0) {
            setProducts(DEMO_DATA)
            setError('Using demo data - please check spreadsheet access')
          } else {
            setProducts(productData)
          }
          
          setLastUpdated(new Date())
          setLoading(false)
          
          // Generate barcodes after state update
          setTimeout(() => {
            const dataToUse = productData.length > 0 ? productData : DEMO_DATA
            dataToUse.forEach((product, index) => {
              generateBarcode(product.eanCode, `barcode-${index}`)
            })
          }, 100)
        },
        error: (error) => {
          console.error('CSV parsing error:', error)
          setProducts(DEMO_DATA)
          setError('Using demo data - spreadsheet parsing failed')
          setLoading(false)
          
          // Generate barcodes for demo data
          setTimeout(() => {
            DEMO_DATA.forEach((product, index) => {
              generateBarcode(product.eanCode, `barcode-${index}`)
            })
          }, 100)
        }
      })
    } catch (err) {
      console.error('Fetch error:', err)
      setProducts(DEMO_DATA)
      setError('Using demo data - spreadsheet not accessible')
      setLoading(false)
      
      // Generate barcodes for demo data
      setTimeout(() => {
        DEMO_DATA.forEach((product, index) => {
          generateBarcode(product.eanCode, `barcode-${index}`)
        })
      }, 100)
    }
  }

  useEffect(() => {
    fetchSpreadsheetData()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getProductImage = (product: Product) => {
    if (product.image && product.image.trim()) {
      return product.image
    }
    // Fallback to a placeholder image service
    return `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&crop=center`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-8 w-24 mb-3" />
                  <Skeleton className="h-16 w-full mb-3" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchSpreadsheetData}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            🛒 Supermarket Discounts
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing deals and save money on your favorite products
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>
              Last updated: {lastUpdated?.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No discounts available</h3>
            <p className="text-gray-600">Check back later for new deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              >
                {/* Product Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop&crop=center`
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg px-3 py-1 shadow-lg">
                      {product.discount}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Product Name */}
                  <CardTitle className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                  </CardTitle>

                  {/* EAN Barcode */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">EAN: {product.eanCode}</span>
                    </div>
                    <div className="flex justify-center">
                      <canvas 
                        id={`barcode-${index}`}
                        className="max-w-full"
                      />
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Valid until: {formatDate(product.validUntil)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Data automatically synced from spreadsheet • Prices and availability subject to change
          </p>
        </div>
      </div>
    </div>
  )
}

export default App