class Script {
  final String id;
  final String title;
  final String content;
  final String language;
  final int wordsPerMinute;
  final int createdAt;
  final int updatedAt;

  const Script({
    required this.id,
    required this.title,
    required this.content,
    required this.language,
    required this.wordsPerMinute,
    required this.createdAt,
    required this.updatedAt,
  });

  Script copyWith({
    String? title,
    String? content,
    int? wordsPerMinute,
    int? updatedAt,
  }) {
    return Script(
      id: id,
      title: title ?? this.title,
      content: content ?? this.content,
      language: language,
      wordsPerMinute: wordsPerMinute ?? this.wordsPerMinute,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, Object?> toMap() => {
        'id': id,
        'title': title,
        'content': content,
        'language': language,
        'wordsPerMinute': wordsPerMinute,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Script.fromMap(Map<String, Object?> map) => Script(
        id: map['id'] as String,
        title: map['title'] as String,
        content: map['content'] as String,
        language: map['language'] as String,
        wordsPerMinute: map['wordsPerMinute'] as int,
        createdAt: map['createdAt'] as int,
        updatedAt: map['updatedAt'] as int,
      );
}

const wpmOptions = [100, 120, 150, 180, 200];

int countWords(String text) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) return 0;
  return trimmed.split(RegExp(r'\s+')).length;
}

int estimateDurationSeconds(String text, int wpm) {
  final words = countWords(text);
  if (words == 0 || wpm <= 0) return 0;
  return ((words / wpm) * 60).round();
}

String formatDuration(int totalSeconds) {
  final s = totalSeconds < 0 ? 0 : totalSeconds;
  final h = s ~/ 3600;
  final m = (s % 3600) ~/ 60;
  final sec = s % 60;
  final mm = m.toString().padLeft(h > 0 ? 2 : 1, '0');
  final ss = sec.toString().padLeft(2, '0');
  return h > 0 ? '$h:$mm:$ss' : '$mm:$ss';
}
