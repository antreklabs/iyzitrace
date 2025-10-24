// Exceptions API Service
// Bu dosya gerçek API endpoint'leri ile entegrasyon için hazırlanmıştır

export interface ExceptionGroup {
  id: string;
  exceptionType: string;
  errorMessage: string;
  count: number;
  lastSeen: string;
  firstSeen: string;
  application: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExceptionDetail {
  id: string;
  eventId: string;
  exceptionType: string;
  errorMessage: string;
  timestamp: string;
  stacktrace: string;
  keyValuePairs: Record<string, any>;
  application: string;
  serviceName?: string;
  traceId?: string;
  spanId?: string;
  logId?: string;
}

export interface ExceptionNavigation {
  hasOlder: boolean;
  hasNewer: boolean;
  currentIndex: number;
  totalCount: number;
}

// Gerçek API fonksiyonları (production için)
const exceptionsApi = {
  async getExceptionGroups(): Promise<ExceptionGroup[]> {
    try {
      const response = await fetch('http://localhost:3000/api/exceptions/groups');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exception groups:', error);
      throw error;
    }
  },

  async getExceptionDetails(groupId: string, index: number = 0): Promise<{
    exception: ExceptionDetail;
    navigation: ExceptionNavigation;
  }> {
    try {
      const response = await fetch(`http://localhost:3000/api/exceptions/groups/${groupId}/details?index=${index}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exception details:', error);
      throw error;
    }
  },

  async getExceptionByIndex(groupId: string, index: number): Promise<ExceptionDetail> {
    try {
      const response = await fetch(`http://localhost:3000/api/exceptions/groups/${groupId}/index/${index}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exception by index:', error);
      throw error;
    }
  },
};

// Mock data (development için)
export const mockExceptionsData = {
  exceptionGroups: [
    {
      id: '1',
      exceptionType: 'SSLError',
      errorMessage: 'HTTPSConnectionPool (host=\'uen.mocky.io\'...',
      count: 2,
      lastSeen: '06/05/2022 10:20:19 AM',
      firstSeen: '06/05/2022 10:20:19 AM',
      application: 'sampleApp',
      severity: 'high' as const,
    },
    {
      id: '2',
      exceptionType: 'ZeroDivisionError',
      errorMessage: 'division by zero',
      count: 6,
      lastSeen: '06/05/2022 10:19:32 AM',
      firstSeen: '06/05/2022 10:19:30 AM',
      application: 'flaskApp',
      severity: 'medium' as const,
    },
    {
      id: '3',
      exceptionType: 'ZeroDivisionError',
      errorMessage: 'division by zero',
      count: 2,
      lastSeen: '06/05/2022 10:20:06 AM',
      firstSeen: '06/05/2022 10:20:04 AM',
      application: 'sampleApp',
      severity: 'medium' as const,
    },
    {
      id: '4',
      exceptionType: 'MaxRetryError',
      errorMessage: 'HTTPSConnectionPool (host=\'uen.mocky.io\'...',
      count: 1,
      lastSeen: '06/05/2022 10:20:19 AM',
      firstSeen: '06/05/2022 10:20:19 AM',
      application: 'sampleApp',
      severity: 'high' as const,
    },
    {
      id: '5',
      exceptionType: 'MaxRetryError',
      errorMessage: 'HTTPSConnectionPool (host=\'un3.mocky.io\'...',
      count: 1,
      lastSeen: '06/05/2022 10:20:16 AM',
      firstSeen: '06/05/2022 10:20:16 AM',
      application: 'sampleApp',
      severity: 'high' as const,
    },
    {
      id: '6',
      exceptionType: 'KeyError',
      errorMessage: '\'user_id\' not found in request data',
      count: 3,
      lastSeen: '06/05/2022 09:45:12 AM',
      firstSeen: '06/05/2022 09:30:05 AM',
      application: 'userService',
      severity: 'low' as const,
    },
    {
      id: '7',
      exceptionType: 'TimeoutError',
      errorMessage: 'Database connection timeout after 30 seconds',
      count: 4,
      lastSeen: '06/05/2022 11:15:33 AM',
      firstSeen: '06/05/2022 10:45:22 AM',
      application: 'databaseService',
      severity: 'critical' as const,
    },
  ] as ExceptionGroup[],

  exceptionDetails: {
    '1': [
      {
        id: '1-1',
        eventId: 'ae79e0501bc443c5a562241867420648',
        exceptionType: 'SSLError',
        errorMessage: 'HTTPSConnectionPool (host=\'uen.mocky.io\', port=443): Max retries exceeded with url: /v3/b851a5c6-ab54-495a-be04-69834ae0d2a7 (Caused by SSLError (SSLCertVerificationError(1, \'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate (_ssl.c:1129)\')))',
        timestamp: '06/05/2022 10:20:19 AM',
        stacktrace: `Traceback (most recent call last):
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1342, in do_open
    httplib_response = self._make_request(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1275, in _make_request
    self._validate_conn(conn)
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1305, in _validate_conn
    conn.connect()
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1322, in _validate_conn
    self.sock = ssl_wrap_socket(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1335, in _validate_conn
    ssl_sock = _ssl_wrap_socket_impl(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 500, in wrap_socket
    return self.sslsocket_class._create(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 1040, in _create
    self.do_handshake()
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 1309, in do_handshake
    self._sslobj.do_handshake()
ssl.SSLError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate (_ssl.c:1129)`,
        keyValuePairs: {
          exceptionEscaped: false,
          spanID: '955ccf17ab02a9bc',
          traceID: 'dba8f6759ec30bf9e46ab3cad6eac449',
          serviceName: 'sampleApp',
          host: 'uen.mocky.io',
          port: 443,
          url: '/v3/b851a5c6-ab54-495a-be04-69834ae0d2a7',
          method: 'GET',
          userAgent: 'python-requests/2.28.1',
        },
        application: 'sampleApp',
        serviceName: 'sampleApp',
        traceId: 'dba8f6759ec30bf9e46ab3cad6eac449',
        spanId: '955ccf17ab02a9bc',
      },
      {
        id: '1-2',
        eventId: 'be89f1612cd554d6b673352978531759',
        exceptionType: 'SSLError',
        errorMessage: 'HTTPSConnectionPool (host=\'uen.mocky.io\', port=443): Max retries exceeded with url: /v3/b851a5c6-ab54-495a-be04-69834ae0d2a7 (Caused by SSLError (SSLCertVerificationError(1, \'[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate (_ssl.c:1129)\')))',
        timestamp: '06/05/2022 10:18:45 AM',
        stacktrace: `Traceback (most recent call last):
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1342, in do_open
    httplib_response = self._make_request(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1275, in _make_request
    self._validate_conn(conn)
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1305, in _validate_conn
    conn.connect()
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1322, in _validate_conn
    self.sock = ssl_wrap_socket(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/urllib/request.py", line 1335, in _validate_conn
    ssl_sock = _ssl_wrap_socket_impl(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 500, in wrap_socket
    return self.sslsocket_class._create(
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 1040, in _create
    self.do_handshake()
  File "/opt/homebrew/Cellar/python@3.9/3.9.10/Frameworks/Python.framework/Versions/3.9/lib/python3.9/ssl.py", line 1309, in do_handshake
    self._sslobj.do_handshake()
ssl.SSLError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate (_ssl.c:1129)`,
        keyValuePairs: {
          exceptionEscaped: false,
          spanID: 'a66dd128bc13b0cd',
          traceID: 'e47f9865af41c2e8b57cd4ef7b8e9f12',
          serviceName: 'sampleApp',
          host: 'uen.mocky.io',
          port: 443,
          url: '/v3/b851a5c6-ab54-495a-be04-69834ae0d2a7',
          method: 'GET',
          userAgent: 'python-requests/2.28.1',
        },
        application: 'sampleApp',
        serviceName: 'sampleApp',
        traceId: 'e47f9865af41c2e8b57cd4ef7b8e9f12',
        spanId: 'a66dd128bc13b0cd',
      },
    ],
    '2': [
      {
        id: '2-1',
        eventId: 'c78f1234ef567890abcdef1234567890',
        exceptionType: 'ZeroDivisionError',
        errorMessage: 'division by zero',
        timestamp: '06/05/2022 10:19:32 AM',
        stacktrace: `Traceback (most recent call last):
  File "/app/flask_app.py", line 45, in calculate_ratio
    result = numerator / denominator
ZeroDivisionError: division by zero`,
        keyValuePairs: {
          exceptionEscaped: false,
          spanID: 'f1234567890abcdef',
          traceID: 'a1b2c3d4e5f6789012345678901234567',
          serviceName: 'flaskApp',
          function: 'calculate_ratio',
          line: 45,
          numerator: 10,
          denominator: 0,
        },
        application: 'flaskApp',
        serviceName: 'flaskApp',
        traceId: 'a1b2c3d4e5f6789012345678901234567',
        spanId: 'f1234567890abcdef',
      },
    ],
  },
};

// Development mode için mock API wrapper
export const mockApi = {
  async getExceptionGroups(): Promise<ExceptionGroup[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockExceptionsData.exceptionGroups), 500);
    });
  },

  async getExceptionDetails(groupId: string, index: number = 0): Promise<{
    exception: ExceptionDetail;
    navigation: ExceptionNavigation;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const groupDetails = mockExceptionsData.exceptionDetails[groupId as keyof typeof mockExceptionsData.exceptionDetails];
        if (groupDetails && groupDetails[index]) {
          const exception = groupDetails[index];
          const navigation: ExceptionNavigation = {
            hasOlder: index > 0,
            hasNewer: index < groupDetails.length - 1,
            currentIndex: index,
            totalCount: groupDetails.length,
          };
          resolve({ exception, navigation });
        } else {
          // Fallback data
          const fallbackException: ExceptionDetail = {
            id: `${groupId}-${index}`,
            eventId: 'fallback-event-id',
            exceptionType: 'UnknownError',
            errorMessage: 'No details available',
            timestamp: new Date().toISOString(),
            stacktrace: 'No stacktrace available',
            keyValuePairs: {},
            application: 'unknown',
          };
          const navigation: ExceptionNavigation = {
            hasOlder: false,
            hasNewer: false,
            currentIndex: 0,
            totalCount: 1,
          };
          resolve({ exception: fallbackException, navigation });
        }
      }, 500);
    });
  },

  async getExceptionByIndex(groupId: string, index: number): Promise<ExceptionDetail> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const groupDetails = mockExceptionsData.exceptionDetails[groupId as keyof typeof mockExceptionsData.exceptionDetails];
        if (groupDetails && groupDetails[index]) {
          resolve(groupDetails[index]);
        } else {
          // Fallback data
          resolve({
            id: `${groupId}-${index}`,
            eventId: 'fallback-event-id',
            exceptionType: 'UnknownError',
            errorMessage: 'No details available',
            timestamp: new Date().toISOString(),
            stacktrace: 'No stacktrace available',
            keyValuePairs: {},
            application: 'unknown',
          });
        }
      }, 500);
    });
  },
};

// Environment'a göre API seçimi
const isDevelopment = process.env.NODE_ENV === 'development';
export const api = isDevelopment ? mockApi : exceptionsApi;
