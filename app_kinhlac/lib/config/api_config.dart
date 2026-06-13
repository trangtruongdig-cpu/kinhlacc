class ApiConfig {
  static const String _envOverride = String.fromEnvironment('API_BASE_URL');
  static const String _defaultUrl = 'https://kinhlac.online/api';

  static String get baseUrl =>
      _envOverride.isNotEmpty ? _envOverride : _defaultUrl;
}
