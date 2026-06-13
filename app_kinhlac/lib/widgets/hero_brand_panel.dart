import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class HeroBrandPanel extends StatelessWidget {
  const HeroBrandPanel({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: 24,
        vertical: compact ? 28 : 48,
      ),
      decoration: const BoxDecoration(gradient: AppColors.heroGradient),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 1.5,
              ),
            ),
            child: const Icon(Icons.spa_outlined,
                color: Colors.white, size: 28),
          ),
          const SizedBox(height: 18),
          const Text(
            'Y Học\nCổ Truyền',
            style: TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w700,
              height: 1.15,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Phòng khám Đông Y\nthông minh & hiện đại',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.75),
              fontSize: 14,
              height: 1.5,
            ),
          ),
          if (!compact) ...[
            const SizedBox(height: 24),
            _feature('Đặt lịch khám online'),
            const SizedBox(height: 8),
            _feature('Hồ sơ bệnh án cá nhân'),
            const SizedBox(height: 8),
            _feature('Tra cứu vị thuốc & bài thuốc'),
          ],
        ],
      ),
    );
  }

  Widget _feature(String text) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: AppColors.brown300,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          text,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.8),
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
