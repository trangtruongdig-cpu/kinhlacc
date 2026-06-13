import 'package:flutter/foundation.dart';

import '../models/patient.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final AuthService _service = AuthService();

  AuthStatus _status = AuthStatus.unknown;
  Patient? _patient;
  bool _loading = false;
  String? _error;

  AuthStatus get status => _status;
  Patient? get patient => _patient;
  bool get isLoading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> bootstrap() async {
    final token = await _service.currentToken();
    final patient = await _service.currentPatient();
    if (token != null && token.isNotEmpty && patient != null) {
      _patient = patient;
      _status = AuthStatus.authenticated;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String phone, String password) async {
    return _run(() => _service.login(phone: phone, password: password));
  }

  Future<bool> register({
    required String phone,
    required String password,
    String? fullName,
  }) async {
    return _run(() => _service.register(
          phone: phone,
          password: password,
          fullName: fullName,
        ));
  }

  Future<void> logout() async {
    await _service.logout();
    _patient = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void clearError() {
    if (_error != null) {
      _error = null;
      notifyListeners();
    }
  }

  Future<bool> _run(Future<AuthResult> Function() action) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await action();
      _patient = result.patient;
      _status = AuthStatus.authenticated;
      _loading = false;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'Đã có lỗi xảy ra, vui lòng thử lại.';
      _loading = false;
      notifyListeners();
      return false;
    }
  }
}
