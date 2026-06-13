import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/examination.dart';
import '../services/examination_service.dart';
import '../theme/app_colors.dart';
import 'examination_detail_screen.dart';

class ExaminationHistoryScreen extends StatefulWidget {
  const ExaminationHistoryScreen({super.key});

  @override
  State<ExaminationHistoryScreen> createState() =>
      _ExaminationHistoryScreenState();
}

class _ExaminationHistoryScreenState extends State<ExaminationHistoryScreen> {
  final _service = ExaminationService();
  List<Examination> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _service.myRecords();
      list.sort((a, b) {
        final ad = a.createdAt;
        final bd = b.createdAt;
        if (ad == null && bd == null) return 0;
        if (ad == null) return 1;
        if (bd == null) return -1;
        return bd.compareTo(ad);
      });
      _items = list;
    } catch (_) {
      _error = 'Không tải được lịch sử khám.';
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(title: const Text('Lịch sử khám bệnh')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _body(),
      ),
    );
  }

  Widget _body() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return ListView(children: [
        const SizedBox(height: 80),
        Center(child: Text(_error!)),
        Center(
            child: TextButton(onPressed: _load, child: const Text('Thử lại'))),
      ]);
    }
    if (_items.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 120),
        Icon(Icons.history, size: 56, color: AppColors.gray400),
        SizedBox(height: 12),
        Center(
          child: Text('Bạn chưa có lần khám nào.',
              style: TextStyle(color: AppColors.gray600)),
        ),
      ]);
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _tile(_items[i]),
    );
  }

  Widget _tile(Examination ex) {
    final date = ex.createdAt;
    final dateLabel = date == null
        ? '—'
        : DateFormat('EEE, dd/MM/yyyy • HH:mm', 'vi').format(date.toLocal());
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ExaminationDetailScreen(examinationId: ex.id),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gray200),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primaryBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.assignment_outlined,
                    color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lần khám #${ex.id}',
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      dateLabel,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.gray600),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        if (ex.amDuong != null && ex.amDuong!.isNotEmpty)
                          _chip(ex.amDuong!),
                        if (ex.khi != null && ex.khi!.isNotEmpty)
                          _chip('Khí: ${ex.khi}'),
                        if (ex.huyet != null && ex.huyet!.isNotEmpty)
                          _chip('Huyết: ${ex.huyet}'),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios,
                  color: AppColors.gray400, size: 14),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.brown50,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.brown700,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}
