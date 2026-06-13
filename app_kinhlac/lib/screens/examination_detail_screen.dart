import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/examination.dart';
import '../services/examination_service.dart';
import '../theme/app_colors.dart';

class ExaminationDetailScreen extends StatefulWidget {
  const ExaminationDetailScreen({super.key, required this.examinationId});
  final int examinationId;

  @override
  State<ExaminationDetailScreen> createState() =>
      _ExaminationDetailScreenState();
}

class _ExaminationDetailScreenState extends State<ExaminationDetailScreen> {
  final _service = ExaminationService();
  Examination? _ex;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _ex = await _service.findOne(widget.examinationId);
    } catch (_) {
      _error = 'Không tải được chi tiết.';
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(title: Text('Lần khám #${widget.examinationId}')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _content(_ex!),
    );
  }

  Widget _content(Examination ex) {
    final dateLabel = ex.createdAt == null
        ? '—'
        : DateFormat('EEEE, dd/MM/yyyy • HH:mm', 'vi')
            .format(ex.createdAt!.toLocal());
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: AppColors.heroGradient,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Thời gian khám',
                  style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text(dateLabel,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _sectionTitle('Tổng quan'),
        const SizedBox(height: 8),
        _kvCard([
          ('Âm Dương', ex.amDuong ?? '—'),
          ('Khí', ex.khi ?? '—'),
          ('Huyết', ex.huyet ?? '—'),
        ]),
        if (ex.syndromes.isNotEmpty) ...[
          const SizedBox(height: 16),
          _sectionTitle('Chứng bệnh'),
          const SizedBox(height: 8),
          ...ex.syndromes.map(_syndromeCard),
        ],
        if (ex.notes != null && ex.notes!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _sectionTitle('Ghi chú của bác sĩ'),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.gray200),
            ),
            child: Text(ex.notes!,
                style: const TextStyle(fontSize: 14, height: 1.5)),
          ),
        ],
      ],
    );
  }

  Widget _sectionTitle(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: AppColors.black,
        ),
      );

  Widget _kvCard(List<(String, String)> rows) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 100,
                    child: Text(
                      rows[i].$1,
                      style: const TextStyle(
                        color: AppColors.gray600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      rows[i].$2,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (i != rows.length - 1)
              const Divider(height: 1, color: AppColors.gray200),
          ],
        ],
      ),
    );
  }

  Widget _syndromeCard(Map<String, dynamic> s) {
    final name = (s['name'] ?? s['tenChungBenh'] ?? s['title'] ?? 'Chứng bệnh')
        .toString();
    final desc = (s['description'] ?? s['moTa'] ?? s['notes'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primaryBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.local_hospital_outlined,
                    color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          if (desc.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(desc,
                style: const TextStyle(
                    fontSize: 13, height: 1.5, color: AppColors.gray700)),
          ],
        ],
      ),
    );
  }
}
