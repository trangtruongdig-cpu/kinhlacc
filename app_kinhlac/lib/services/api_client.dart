import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

class ApiClient {
  ApiClient._internal()
      : _dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static const String tokenKey = 'access_token';

  static final ApiClient instance = ApiClient._internal();

  final Dio _dio;

  Dio get dio => _dio;

  Future<SharedPreferences> _prefs() => SharedPreferences.getInstance();

  Future<String?> readToken() async {
    final p = await _prefs();
    return p.getString(tokenKey);
  }

  Future<String?> readString(String key) async {
    final p = await _prefs();
    return p.getString(key);
  }

  Future<void> writeString(String key, String value) async {
    final p = await _prefs();
    await p.setString(key, value);
  }

  Future<void> remove(String key) async {
    final p = await _prefs();
    await p.remove(key);
  }
}
