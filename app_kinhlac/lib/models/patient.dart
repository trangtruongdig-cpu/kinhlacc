class Patient {
  final int id;
  final String phone;
  final String? fullName;

  Patient({required this.id, required this.phone, this.fullName});

  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
        id: json['id'] as int,
        phone: json['phone'] as String,
        fullName: json['fullName'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'fullName': fullName,
      };
}
