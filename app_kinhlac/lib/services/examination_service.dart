import 'package:dio/dio.dart';

import '../models/examination.dart';
import 'api_client.dart';

class ExaminationService {
  final Dio _dio = ApiClient.instance.dio;

  Future<List<Examination>> myRecords() async {
    final res = await _dio.get('/examinations/my-records');
    final list = res.data as List;
    return list
        .map((e) => Examination.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Examination> findOne(int id) async {
    final res = await _dio.get('/examinations/$id');
    return Examination.fromJson(res.data as Map<String, dynamic>);
  }
}
