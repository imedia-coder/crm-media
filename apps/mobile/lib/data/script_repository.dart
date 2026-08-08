import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../models/recording.dart';
import '../models/script.dart';
import '../models/script_settings.dart';
import 'database.dart';

const _uuid = Uuid();

class ScriptRepository {
  ScriptRepository._();
  static final ScriptRepository instance = ScriptRepository._();

  Future<List<Script>> listScripts() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('scripts', orderBy: 'updatedAt DESC');
    return rows.map(Script.fromMap).toList();
  }

  Future<Script?> getScript(String id) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('scripts', where: 'id = ?', whereArgs: [id]);
    if (rows.isEmpty) return null;
    return Script.fromMap(rows.first);
  }

  Future<Script> createScript({String title = 'Sans titre', String content = ''}) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final script = Script(
      id: _uuid.v4(),
      title: title,
      content: content,
      language: 'fr',
      wordsPerMinute: 150,
      createdAt: now,
      updatedAt: now,
    );
    final db = await AppDatabase.instance.database;
    await db.insert('scripts', script.toMap());
    await db.insert(
      'script_settings',
      ScriptSettings(scriptId: script.id).toMap(),
    );
    return script;
  }

  Future<void> saveScript(Script script) async {
    final db = await AppDatabase.instance.database;
    await db.update(
      'scripts',
      script.copyWith(updatedAt: DateTime.now().millisecondsSinceEpoch).toMap(),
      where: 'id = ?',
      whereArgs: [script.id],
    );
  }

  Future<void> deleteScript(String id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('scripts', where: 'id = ?', whereArgs: [id]);
    await db.delete('script_settings', where: 'scriptId = ?', whereArgs: [id]);
    await db.delete('recordings', where: 'scriptId = ?', whereArgs: [id]);
  }

  Future<ScriptSettings> getSettings(String scriptId) async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query(
      'script_settings',
      where: 'scriptId = ?',
      whereArgs: [scriptId],
    );
    if (rows.isEmpty) return ScriptSettings(scriptId: scriptId);
    return ScriptSettings.fromMap(rows.first);
  }

  Future<void> saveSettings(ScriptSettings settings) async {
    final db = await AppDatabase.instance.database;
    await db.insert(
      'script_settings',
      settings.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Recording>> listRecordings() async {
    final db = await AppDatabase.instance.database;
    final rows = await db.query('recordings', orderBy: 'createdAt DESC');
    return rows.map(Recording.fromMap).toList();
  }

  Future<Recording> saveRecording({
    required String scriptId,
    required String title,
    required String filePath,
    required int durationSeconds,
    required String resolution,
  }) async {
    final recording = Recording(
      id: _uuid.v4(),
      scriptId: scriptId,
      title: title,
      filePath: filePath,
      durationSeconds: durationSeconds,
      resolution: resolution,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );
    final db = await AppDatabase.instance.database;
    await db.insert('recordings', recording.toMap());
    return recording;
  }

  Future<void> deleteRecording(String id) async {
    final db = await AppDatabase.instance.database;
    await db.delete('recordings', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> renameRecording(String id, String title) async {
    final db = await AppDatabase.instance.database;
    await db.update('recordings', {'title': title}, where: 'id = ?', whereArgs: [id]);
  }
}
