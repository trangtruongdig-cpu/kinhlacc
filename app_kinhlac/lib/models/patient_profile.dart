class PatientProfile {
  final int id;
  final String? fullName;
  final String? gender;
  final String? dateOfBirth;
  final String? timeOfBirth;
  final String? phone;
  final String? address;
  final String? province;
  final String? medicalHistory;
  final String? notes;

  PatientProfile({
    required this.id,
    this.fullName,
    this.gender,
    this.dateOfBirth,
    this.timeOfBirth,
    this.phone,
    this.address,
    this.province,
    this.medicalHistory,
    this.notes,
  });

  factory PatientProfile.fromJson(Map<String, dynamic> json) {
    return PatientProfile(
      id: json['id'] as int,
      fullName: json['fullName'] as String?,
      gender: json['gender'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      timeOfBirth: json['timeOfBirth'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      province: json['province'] as String?,
      medicalHistory: json['medicalHistory'] as String?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toUpdateJson() => {
        if (fullName != null) 'fullName': fullName,
        if (gender != null) 'gender': gender,
        if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
        if (timeOfBirth != null) 'timeOfBirth': timeOfBirth,
        if (phone != null) 'phone': phone,
        if (address != null) 'address': address,
        if (province != null) 'province': province,
        if (medicalHistory != null) 'medicalHistory': medicalHistory,
        if (notes != null) 'notes': notes,
      };
}
