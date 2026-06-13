import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/appointment_slot.dart';
import '../services/appointment_service.dart';
import '../theme/app_colors.dart';
import 'booking_screen.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  final _service = AppointmentService();
  List<AppointmentSlot> _slots = [];
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
      _slots = await _service.myAppointments();
    } catch (_) {
      _error = 'Không tải được lịch hẹn.';
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _cancel(AppointmentSlot slot) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Huỷ lịch hẹn?'),
        content: Text(
          'Bạn chắc chắn muốn huỷ lịch ngày ${slot.slotDate} lúc ${slot.slotTime}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Không'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Huỷ lịch',
                style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _service.cancelMy(slot.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã huỷ lịch hẹn')),
      );
      _load();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Huỷ thất bại, vui lòng thử lại.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        title: const Text('Lịch hẹn của tôi'),
        actions: [
          IconButton(
            tooltip: 'Đặt lịch mới',
            icon: const Icon(Icons.add, color: AppColors.primary),
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const BookingScreen()),
              );
              _load();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _body(),
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Center(child: Text(_error!)),
          const SizedBox(height: 8),
          Center(
            child: TextButton(onPressed: _load, child: const Text('Thử lại')),
          ),
        ],
      );
    }
    if (_slots.isEmpty) {
      return ListView(
        children: [
          const SizedBox(height: 100),
          const Icon(Icons.event_busy,
              size: 56, color: AppColors.gray400),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              'Bạn chưa có lịch hẹn nào.',
              style: TextStyle(color: AppColors.gray600),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton.icon(
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const BookingScreen()),
                );
                _load();
              },
              icon: const Icon(Icons.add),
              label: const Text('Đặt lịch ngay'),
            ),
          ),
        ],
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _slots.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _tile(_slots[i]),
    );
  }

  Widget _tile(AppointmentSlot slot) {
    final color = switch (slot.status) {
      SlotStatus.booked => AppColors.warning,
      SlotStatus.completed => AppColors.info,
      SlotStatus.cancelled => AppColors.gray500,
      _ => AppColors.gray500,
    };
    DateTime? d;
    try {
      d = DateFormat('yyyy-MM-dd').parse(slot.slotDate);
    } catch (_) {}
    final dateLabel =
        d == null ? slot.slotDate : DateFormat('EEE, dd/MM/yyyy', 'vi').format(d);
    final canCancel = slot.status == SlotStatus.booked;

    return Container(
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
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  slot.status.label,
                  style: TextStyle(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                slot.slotTime,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 16, color: AppColors.gray600),
              const SizedBox(width: 6),
              Text(dateLabel,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
          if (slot.reason != null && slot.reason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.notes,
                    size: 16, color: AppColors.gray600),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    slot.reason!,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.gray700),
                  ),
                ),
              ],
            ),
          ],
          if (canCancel) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => _cancel(slot),
                icon: const Icon(Icons.cancel_outlined,
                    size: 16, color: AppColors.danger),
                label: const Text('Huỷ lịch',
                    style: TextStyle(color: AppColors.danger)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
