import 'dart:convert';

import 'package:dio/dio.dart';

import '../models/patient.dart';
import 'api_client.dart';

class AuthResult {
  final String accessToken;
  final Patient patient;
  AuthResult({required this.accessToken, required this.patient});
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  @override
  String toString() => message;
}

class AuthService {
  static const String _patientKey = 'patient_profile';

  final ApiClient _api = ApiClient.instance;

  Future<AuthResult> login({
    required String phone,
    required String password,
  }) async {
    return _post('/patient-auth/login', {
      'phone': phone,
      'password': password,
    });
  }

  Future<AuthResult> register({
    required String phone,
    required String password,
    String? fullName,
  }) async {
    return _post('/patient-auth/register', {
      'phone': phone,
      'password': password,
      if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
    });
  }

  Future<void> logout() async {
    await _api.remove(ApiClient.tokenKey);
    await _api.remove(_patientKey);
  }

  Future<Patient?> currentPatient() async {
    final raw = await _api.readString(_patientKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return Patient.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<String?> currentToken() {
    return _api.readToken();
  }

  Future<AuthResult> _post(String path, Map<String, dynamic> body) async {
    try {
      final res = await _api.dio.post(path, data: body);
      final data = res.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      final patient =
          Patient.fromJson(data['patient'] as Map<String, dynamic>);
      await _api.writeString(ApiClient.tokenKey, token);
      await _api.writeString(_patientKey, jsonEncode(patient.toJson()));
      return AuthResult(accessToken: token, patient: patient);
    } on DioException catch (e) {
      throw AuthException(_extractMessage(e));
    }
  }

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] != null) {
      final msg = data['message'];
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
      return msg.toString();
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Kết nối quá lâu, vui lòng thử lại.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.';
    }
    return 'Đã có lỗi xảy ra, vui lòng thử lại.';
  }
}
