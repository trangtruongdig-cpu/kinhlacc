import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/appointment_slot.dart';
import '../services/appointment_service.dart';
import '../theme/app_colors.dart';
import '../widgets/gradient_button.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _service = AppointmentService();

  late DateTime _selectedDate;
  late DateTime _today;
  List<AppointmentSlot> _slots = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _today = DateTime(now.year, now.month, now.day);
    _selectedDate = _today;
    _load();
  }

  String _fmtDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _service.listByDate(_fmtDate(_selectedDate));
      list.sort((a, b) => a.slotTime.compareTo(b.slotTime));
      _slots = list;
    } catch (_) {
      _error = 'Không tải được danh sách lịch hẹn.';
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _book(AppointmentSlot slot) async {
    final reasonCtrl = TextEditingController();
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: _BookingSheet(
            slot: slot,
            reasonCtrl: reasonCtrl,
          ),
        );
      },
    );
    if (confirmed != true) return;

    try {
      await _service.bookSlot(
        slotId: slot.id,
        reason: reasonCtrl.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã đặt lịch ${slot.slotTime} ngày ${_fmtDate(_selectedDate)}'),
        ),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đặt lịch thất bại: ${_extract(e)}')),
      );
    }
  }

  String _extract(Object e) {
    final s = e.toString();
    if (s.contains('không khả dụng')) return 'Khung giờ vừa bị người khác đặt.';
    return 'Vui lòng thử lại.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(title: const Text('Đặt lịch khám')),
      body: Column(
        children: [
          _datePickerStrip(),
          const SizedBox(height: 8),
          Expanded(child: _body()),
        ],
      ),
    );
  }

  Widget _datePickerStrip() {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: SizedBox(
        height: 72,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: 14,
          itemBuilder: (_, i) {
            final date = _today.add(Duration(days: i));
            final selected = date.year == _selectedDate.year &&
                date.month == _selectedDate.month &&
                date.day == _selectedDate.day;
            return GestureDetector(
              onTap: () {
                setState(() => _selectedDate = date);
                _load();
              },
              child: Container(
                width: 60,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  gradient: selected ? AppColors.buttonGradient : null,
                  color: selected ? null : AppColors.gray50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: selected ? Colors.transparent : AppColors.gray200,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      DateFormat('EEE', 'vi').format(date),
                      style: TextStyle(
                        fontSize: 12,
                        color: selected ? Colors.white70 : AppColors.gray600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${date.day}',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : AppColors.black,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, color: AppColors.gray400, size: 48),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              TextButton(onPressed: _load, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }
    if (_slots.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Ngày này phòng khám chưa mở khung giờ.\nVui lòng chọn ngày khác.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.gray600),
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _slots.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _slotTile(_slots[i]),
    );
  }

  Widget _slotTile(AppointmentSlot slot) {
    final isOpen = slot.status == SlotStatus.open;
    final color = switch (slot.status) {
      SlotStatus.open => AppColors.success,
      SlotStatus.booked => AppColors.warning,
      SlotStatus.completed => AppColors.info,
      _ => AppColors.gray500,
    };
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: isOpen ? () => _book(slot) : null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gray200),
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primaryBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.access_time,
                    color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      slot.slotTime,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        slot.status.label,
                        style: TextStyle(
                          fontSize: 12,
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (isOpen)
                const Icon(Icons.arrow_forward_ios,
                    color: AppColors.gray400, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingSheet extends StatefulWidget {
  const _BookingSheet({required this.slot, required this.reasonCtrl});
  final AppointmentSlot slot;
  final TextEditingController reasonCtrl;

  @override
  State<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends State<_BookingSheet> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Xác nhận đặt lịch',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            'Ngày ${widget.slot.slotDate} • ${widget.slot.slotTime}',
            style: const TextStyle(color: AppColors.gray600),
          ),
          const SizedBox(height: 16),
          const Text(
            'Lý do khám (tuỳ chọn)',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: widget.reasonCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Ví dụ: đau lưng, mất ngủ kéo dài...',
            ),
          ),
          const SizedBox(height: 18),
          GradientButton(
            label: 'Đặt lịch',
            onPressed: () => Navigator.of(context).pop(true),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Huỷ'),
          ),
        ],
      ),
    );
  }
}
