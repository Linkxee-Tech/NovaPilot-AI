class NovaError(Exception):
    """Base exception for NovaPilot"""
    pass

class AuthError(NovaError):
    """Authentication or Authorization failed"""
    pass

class PlatformError(NovaError):
    """External platform (LinkedIn/Twitter) returned an error"""
    pass

class RateLimitError(PlatformError):
    """External platform rate limit hit"""
    pass

class SelectorError(PlatformError):
    """UI changed, selectors no longer work"""
    pass

class CircuitBreakerError(NovaError):
    """Circuit breaker is open, preventing execution"""
    pass
