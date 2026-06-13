enum SlotStatus { open, closed, booked, completed, cancelled, unknown }

extension SlotStatusX on SlotStatus {
  String get label {
    switch (this) {
      case SlotStatus.open:
        return 'Trống';
      case SlotStatus.closed:
        return 'Đã đóng';
      case SlotStatus.booked:
        return 'Đã đặt';
      case SlotStatus.completed:
        return 'Đã khám';
      case SlotStatus.cancelled:
        return 'Đã huỷ';
      case SlotStatus.unknown:
        return '—';
    }
  }

  static SlotStatus parse(String? raw) {
    switch (raw) {
      case 'OPEN':
        return SlotStatus.open;
      case 'CLOSED':
        return SlotStatus.closed;
      case 'BOOKED':
        return SlotStatus.booked;
      case 'COMPLETED':
        return SlotStatus.completed;
      case 'CANCELLED':
        return SlotStatus.cancelled;
      default:
        return SlotStatus.unknown;
    }
  }
}

class AppointmentSlot {
  final int id;
  final String slotDate;
  final String slotTime;
  final SlotStatus status;
  final int? patientId;
  final String? reason;
  final String? notes;

  AppointmentSlot({
    required this.id,
    required this.slotDate,
    required this.slotTime,
    required this.status,
    this.patientId,
    this.reason,
    this.notes,
  });

  factory AppointmentSlot.fromJson(Map<String, dynamic> json) {
    return AppointmentSlot(
      id: json['id'] as int,
      slotDate: json['slotDate'] as String,
      slotTime: (json['slotTime'] as String).substring(0, 5),
      status: SlotStatusX.parse(json['status'] as String?),
      patientId: json['patientId'] as int?,
      reason: json['reason'] as String?,
      notes: json['notes'] as String?,
    );
  }
}
