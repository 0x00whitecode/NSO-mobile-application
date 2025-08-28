// Enhanced polyfills for cross-platform compatibility
// This file should be imported early in the application lifecycle

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// Enhanced window polyfill for SSR/Node.js environments
if (typeof window === 'undefined') {
  const mockStorage = {
    _data: new Map<string, string>(),
    getItem: (key: string) => {
      return mockStorage._data.get(key) || null;
    },
    setItem: (key: string, value: string) => {
      mockStorage._data.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage._data.delete(key);
    },
    clear: () => {
      mockStorage._data.clear();
    },
    key: (index: number) => {
      const keys = Array.from(mockStorage._data.keys());
      return keys[index] || null;
    },
    get length() {
      return mockStorage._data.size;
    }
  };

  (global as any).window = {
    localStorage: { ...mockStorage },
    sessionStorage: { ...mockStorage },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: ''
    }
  };
}

// Enhanced document polyfill
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tagName: string) => ({
      tagName: tagName.toUpperCase(),
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: '',
      textContent: ''
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createTextNode: (text: string) => ({ textContent: text }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
      style: {}
    },
    head: {
      appendChild: () => {},
      removeChild: () => {},
      style: {}
    }
  };
}

// Enhanced navigator polyfill
if (typeof navigator === 'undefined') {
  (global as any).navigator = {
    product: isReactNative ? 'ReactNative' : 'Gecko',
    userAgent: isReactNative ? 'ReactNative' : 'Mozilla/5.0',
    platform: isReactNative ? 'ReactNative' : 'Web',
    language: 'en-US',
    languages: ['en-US', 'en'],
    cookieEnabled: true,
    onLine: true,
    geolocation: {
      getCurrentPosition: (success: any, error: any, options?: any) => {
        if (error) error({ code: 2, message: 'Geolocation not supported' });
      },
      watchPosition: (success: any, error: any, options?: any) => {
        if (error) error({ code: 2, message: 'Geolocation not supported' });
        return -1;
      },
      clearWatch: (watchId: number) => {}
    },
    mediaDevices: {
      getUserMedia: () => Promise.reject(new Error('Media devices not supported')),
      enumerateDevices: () => Promise.resolve([])
    }
  };
}

// Enhanced location polyfill
if (typeof location === 'undefined') {
  (global as any).location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: () => {},
    assign: (url: string) => {},
    replace: (url: string) => {}
  };
}

// Additional polyfills for React Native compatibility
if (isReactNative || isNode) {
  // Polyfill for fetch if not available
  if (typeof fetch === 'undefined') {
    (global as any).fetch = async (url: string, options?: any) => {
      throw new Error('Fetch not available in this environment');
    };
  }

  // Polyfill for XMLHttpRequest if not available
  if (typeof XMLHttpRequest === 'undefined') {
    (global as any).XMLHttpRequest = class XMLHttpRequest {
      open() {}
      send() {}
      setRequestHeader() {}
      getResponseHeader() { return null; }
      getAllResponseHeaders() { return ''; }
      readyState = 0;
      status = 0;
      statusText = '';
      responseText = '';
      response = null;
      onreadystatechange = null;
      onload = null;
      onerror = null;
    };
  }

  // Polyfill for WebSocket if not available
  if (typeof WebSocket === 'undefined') {
    (global as any).WebSocket = class WebSocket {
      constructor(url: string) {
        this.url = url;
        this.readyState = 0;
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
      }
      url: string;
      readyState: number;
      CONNECTING: number;
      OPEN: number;
      CLOSING: number;
      CLOSED: number;
      send() {}
      close() {}
      addEventListener() {}
      removeEventListener() {}
    };
  }
}

// Console polyfill for better error handling
if (typeof console === 'undefined') {
  (global as any).console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {}
  };
}

export { };

