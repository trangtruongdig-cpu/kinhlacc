import 'package:dio/dio.dart';

import '../models/appointment_slot.dart';
import 'api_client.dart';

class AppointmentService {
  final Dio _dio = ApiClient.instance.dio;

  Future<List<AppointmentSlot>> listByDate(String date) async {
    final res = await _dio.get('/appointment-slots', queryParameters: {'date': date});
    final list = res.data as List;
    return list
        .map((e) => AppointmentSlot.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AppointmentSlot>> myAppointments() async {
    final res = await _dio.get('/appointment-slots/my');
    final list = res.data as List;
    return list
        .map((e) => AppointmentSlot.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<AppointmentSlot> bookSlot({
    required int slotId,
    String? reason,
    String? notes,
  }) async {
    final res = await _dio.post(
      '/appointment-slots/$slotId/my-book',
      data: {
        if (reason != null && reason.isNotEmpty) 'reason': reason,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    final body = res.data as Map<String, dynamic>;
    return AppointmentSlot.fromJson(body['data'] as Map<String, dynamic>);
  }

  Future<AppointmentSlot> cancelMy(int slotId) async {
    final res = await _dio.put('/appointment-slots/$slotId/my-cancel');
    final body = res.data as Map<String, dynamic>;
    return AppointmentSlot.fromJson(body['data'] as Map<String, dynamic>);
  }
}
