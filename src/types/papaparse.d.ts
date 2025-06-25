declare module 'papaparse' {
  interface ParseResult<T = unknown> {
    data: T[]
    errors: ParseError[]
    meta: ParseMeta
  }

  interface ParseError {
    type: string
    code: string
    message: string
    row?: number
  }

  interface ParseMeta {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
  }

  interface ParseConfig {
    header?: boolean
    skipEmptyLines?: boolean
    complete?: (results: ParseResult) => void
    error?: (error: ParseError) => void
  }

  const Papa: {
    parse: (input: string, config?: ParseConfig) => ParseResult | void
  }

  export = Papa
}