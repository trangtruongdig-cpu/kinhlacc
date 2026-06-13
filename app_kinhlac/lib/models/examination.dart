class Examination {
  final int id;
  final int patientId;
  final String? amDuong;
  final String? khi;
  final String? huyet;
  final List<Map<String, dynamic>> syndromes;
  final String? notes;
  final DateTime? createdAt;

  Examination({
    required this.id,
    required this.patientId,
    this.amDuong,
    this.khi,
    this.huyet,
    required this.syndromes,
    this.notes,
    this.createdAt,
  });

  factory Examination.fromJson(Map<String, dynamic> json) {
    final rawSyn = json['syndromes'];
    final syndromes = <Map<String, dynamic>>[];
    if (rawSyn is List) {
      for (final s in rawSyn) {
        if (s is Map) {
          syndromes.add(Map<String, dynamic>.from(s));
        }
      }
    }
    DateTime? created;
    final ca = json['createdAt'];
    if (ca is String) {
      created = DateTime.tryParse(ca);
    }
    return Examination(
      id: json['id'] as int,
      patientId: json['patientId'] as int,
      amDuong: json['amDuong'] as String?,
      khi: json['khi'] as String?,
      huyet: json['huyet'] as String?,
      syndromes: syndromes,
      notes: json['notes'] as String?,
      createdAt: created,
    );
  }
}
