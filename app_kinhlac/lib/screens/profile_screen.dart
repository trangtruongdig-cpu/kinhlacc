import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/patient_service.dart';
import '../theme/app_colors.dart';
import '../widgets/gradient_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _service = PatientService();
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _address;
  late final TextEditingController _province;
  late final TextEditingController _history;

  String? _gender;
  DateTime? _birthDate;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController();
    _phone = TextEditingController();
    _address = TextEditingController();
    _province = TextEditingController();
    _history = TextEditingController();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _province.dispose();
    _history.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final id = auth.patient?.id;
    if (id == null) {
      setState(() {
        _loading = false;
        _error = 'Không xác định được bệnh nhân.';
      });
      return;
    }
    try {
      final p = await _service.fetch(id);
      _name.text = p.fullName ?? '';
      _phone.text = p.phone ?? '';
      _address.text = p.address ?? '';
      _province.text = p.province ?? '';
      _history.text = p.medicalHistory ?? '';
      _gender = p.gender;
      if (p.dateOfBirth != null && p.dateOfBirth!.isNotEmpty) {
        _birthDate = DateTime.tryParse(p.dateOfBirth!);
      }
    } catch (_) {
      _error = 'Không tải được hồ sơ.';
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final id = auth.patient?.id;
    if (id == null) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final dob = _birthDate;
      final payload = <String, dynamic>{
        'fullName': _name.text.trim(),
        'phone': _phone.text.trim(),
        'address': _address.text.trim(),
        'province': _province.text.trim(),
        'medicalHistory': _history.text.trim(),
        if (_gender != null) 'gender': _gender,
        if (dob != null)
          'dateOfBirth':
              '${dob.year.toString().padLeft(4, '0')}-${dob.month.toString().padLeft(2, '0')}-${dob.day.toString().padLeft(2, '0')}',
      };
      await _service.update(id, payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã lưu hồ sơ')),
        );
      }
    } catch (_) {
      setState(() => _error = 'Lưu thất bại, vui lòng thử lại.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(now.year - 30, 1, 1),
      firstDate: DateTime(1900),
      lastDate: now,
      helpText: 'Chọn ngày sinh',
      cancelText: 'Huỷ',
      confirmText: 'Chọn',
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(title: const Text('Hồ sơ của tôi')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _errorBox(_error!),
                      ),
                    _label('Họ và tên'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Bắt buộc' : null,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.person_outline, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('Giới tính'),
                    const SizedBox(height: 6),
                    _genderSelector(),
                    const SizedBox(height: 14),
                    _label('Ngày sinh'),
                    const SizedBox(height: 6),
                    InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: _pickDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.event_outlined, size: 20),
                        ),
                        child: Text(
                          _birthDate == null
                              ? 'Chọn ngày sinh'
                              : DateFormat('dd/MM/yyyy').format(_birthDate!),
                          style: TextStyle(
                            color: _birthDate == null
                                ? AppColors.gray400
                                : AppColors.black,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('Số điện thoại'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                      ],
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('Tỉnh/Thành'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _province,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.location_city_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('Địa chỉ'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _address,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.home_outlined, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),
                    _label('Tiền sử bệnh'),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _history,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Tiền sử bệnh, dị ứng thuốc, phẫu thuật...',
                      ),
                    ),
                    const SizedBox(height: 24),
                    GradientButton(
                      label: 'Lưu thay đổi',
                      loading: _saving,
                      onPressed: _saving ? null : _save,
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _genderSelector() {
    final options = [
      ('Nam', 'Nam'),
      ('Nữ', 'Nữ'),
      ('Khác', 'Khác'),
    ];
    return Wrap(
      spacing: 8,
      children: options.map((o) {
        final selected = _gender == o.$2;
        return ChoiceChip(
          label: Text(o.$1),
          selected: selected,
          onSelected: (_) => setState(() => _gender = o.$2),
          selectedColor: AppColors.primaryBg,
          labelStyle: TextStyle(
            color: selected ? AppColors.primary : AppColors.gray700,
            fontWeight: FontWeight.w600,
          ),
          side: BorderSide(
            color: selected ? AppColors.primary : AppColors.gray300,
          ),
        );
      }).toList(),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.gray700,
        ),
      );

  Widget _errorBox(String msg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          border: Border.all(color: const Color(0xFFFECACA)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
          const SizedBox(width: 10),
          Expanded(
              child: Text(msg,
                  style: const TextStyle(
                      color: AppColors.danger, fontSize: 13))),
        ]),
      );
}
