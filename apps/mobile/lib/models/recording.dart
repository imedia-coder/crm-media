class Recording {
  final String id;
  final String scriptId;
  final String title;
  final String filePath;
  final int durationSeconds;
  final String resolution;
  final int createdAt;

  const Recording({
    required this.id,
    required this.scriptId,
    required this.title,
    required this.filePath,
    required this.durationSeconds,
    required this.resolution,
    required this.createdAt,
  });

  Map<String, Object?> toMap() => {
        'id': id,
        'scriptId': scriptId,
        'title': title,
        'filePath': filePath,
        'durationSeconds': durationSeconds,
        'resolution': resolution,
        'createdAt': createdAt,
      };

  factory Recording.fromMap(Map<String, Object?> map) => Recording(
        id: map['id'] as String,
        scriptId: map['scriptId'] as String,
        title: map['title'] as String,
        filePath: map['filePath'] as String,
        durationSeconds: map['durationSeconds'] as int,
        resolution: map['resolution'] as String,
        createdAt: map['createdAt'] as int,
      );
}
