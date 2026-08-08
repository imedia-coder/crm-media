import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class AppDatabase {
  AppDatabase._();
  static final AppDatabase instance = AppDatabase._();

  Database? _db;

  Future<Database> get database async {
    _db ??= await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'teleprompt.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE scripts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            language TEXT NOT NULL,
            wordsPerMinute INTEGER NOT NULL,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE script_settings (
            scriptId TEXT PRIMARY KEY,
            fontSize REAL NOT NULL,
            lineHeight REAL NOT NULL,
            textWidth REAL NOT NULL,
            colorTheme TEXT NOT NULL,
            customBackground INTEGER NOT NULL,
            customForeground INTEGER NOT NULL,
            scrollSpeed REAL NOT NULL,
            mirrorMode INTEGER NOT NULL,
            markerEnabled INTEGER NOT NULL,
            countdownSeconds INTEGER NOT NULL,
            FOREIGN KEY (scriptId) REFERENCES scripts (id) ON DELETE CASCADE
          )
        ''');
        await db.execute('''
          CREATE TABLE recordings (
            id TEXT PRIMARY KEY,
            scriptId TEXT NOT NULL,
            title TEXT NOT NULL,
            filePath TEXT NOT NULL,
            durationSeconds INTEGER NOT NULL,
            resolution TEXT NOT NULL,
            createdAt INTEGER NOT NULL
          )
        ''');
      },
    );
  }
}
