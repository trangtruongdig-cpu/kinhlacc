import 'package:dio/dio.dart';

import '../models/patient_profile.dart';
import 'api_client.dart';

class PatientService {
  final Dio _dio = ApiClient.instance.dio;

  Future<PatientProfile> fetch(int id) async {
    final res = await _dio.get('/patients/$id');
    return PatientProfile.fromJson(res.data as Map<String, dynamic>);
  }

  Future<PatientProfile> update(int id, Map<String, dynamic> payload) async {
    final res = await _dio.put('/patients/$id', data: payload);
    final body = res.data as Map<String, dynamic>;
    return PatientProfile.fromJson(body['data'] as Map<String, dynamic>);
  }
}
