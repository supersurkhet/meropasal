use base64::{engine::general_purpose::STANDARD as B64, Engine};
use calamine::{open_workbook_auto, Reader};
use serde::Serialize;
use std::fs;
use std::io::Read as IoRead;
use std::path::Path;

#[derive(Serialize)]
pub struct FileBase64Result {
	pub data: String,
	pub mime_type: String,
	pub size: u64,
}

#[derive(Serialize)]
pub struct ParsedText {
	pub text: String,
}

// ── Base64 encoding ────────────────────────────────────

#[tauri::command]
pub fn read_file_base64(path: String) -> Result<FileBase64Result, String> {
	let p = Path::new(&path);
	let metadata = fs::metadata(p).map_err(|e| format!("Cannot read file: {e}"))?;
	let bytes = fs::read(p).map_err(|e| format!("Failed to read file: {e}"))?;
	let data = B64.encode(&bytes);
	let mime_type = mime_from_ext(p);

	Ok(FileBase64Result {
		data,
		mime_type,
		size: metadata.len(),
	})
}

// ── Spreadsheet parsing ────────────────────────────────

#[tauri::command]
pub fn parse_spreadsheet(path: String) -> Result<ParsedText, String> {
	let p = Path::new(&path);
	let ext = p
		.extension()
		.and_then(|e| e.to_str())
		.unwrap_or("")
		.to_lowercase();

	if ext == "csv" {
		let content = fs::read_to_string(p).map_err(|e| format!("Failed to read CSV: {e}"))?;
		return Ok(ParsedText { text: content });
	}

	let mut workbook =
		open_workbook_auto(p).map_err(|e| format!("Failed to open spreadsheet: {e}"))?;

	let mut output = String::new();
	let sheet_names: Vec<String> = workbook.sheet_names().to_vec();

	for name in sheet_names {
		if let Ok(range) = workbook.worksheet_range(&name) {
			output.push_str(&format!("--- Sheet: {} ---\n", name));
			for row in range.rows() {
				let cells: Vec<String> = row
					.iter()
					.map(|cell| match cell {
						calamine::Data::Empty => String::new(),
						calamine::Data::String(s) => s.clone(),
						calamine::Data::Float(f) => {
							if *f == (*f as i64) as f64 {
								format!("{}", *f as i64)
							} else {
								format!("{f}")
							}
						}
						calamine::Data::Int(i) => format!("{i}"),
						calamine::Data::Bool(b) => format!("{b}"),
						calamine::Data::DateTime(dt) => format!("{dt}"),
						calamine::Data::Error(e) => format!("{e:?}"),
						calamine::Data::DateTimeIso(s) => s.clone(),
						calamine::Data::DurationIso(s) => s.clone(),
					})
					.collect();
				output.push_str(&cells.join(","));
				output.push('\n');
			}
			output.push('\n');
		}
	}

	Ok(ParsedText { text: output })
}

// ── Word document parsing ──────────────────────────────

#[tauri::command]
pub fn parse_word_doc(path: String) -> Result<ParsedText, String> {
	let file = fs::File::open(&path).map_err(|e| format!("Failed to open file: {e}"))?;
	let mut archive =
		zip::ZipArchive::new(file).map_err(|e| format!("Invalid docx file: {e}"))?;

	let mut xml_content = String::new();
	{
		let mut doc_file = archive
			.by_name("word/document.xml")
			.map_err(|_| "No word/document.xml found in docx".to_string())?;
		doc_file
			.read_to_string(&mut xml_content)
			.map_err(|e| format!("Failed to read document.xml: {e}"))?;
	}

	// Extract text from XML using quick-xml
	let mut reader = quick_xml::Reader::from_str(&xml_content);
	let mut text = String::new();
	let mut in_text_element = false;
	let mut in_paragraph = false;
	let mut paragraph_has_text = false;

	loop {
		match reader.read_event() {
			Ok(quick_xml::events::Event::Start(ref e)) => {
				let local = e.local_name();
				if local.as_ref() == b"t" {
					in_text_element = true;
				} else if local.as_ref() == b"p" {
					// New paragraph — add newline if previous had text
					if in_paragraph && paragraph_has_text {
						text.push('\n');
					}
					in_paragraph = true;
					paragraph_has_text = false;
				} else if local.as_ref() == b"tab" {
					text.push('\t');
				} else if local.as_ref() == b"br" {
					text.push('\n');
				}
			}
			Ok(quick_xml::events::Event::Text(ref e)) => {
				if in_text_element {
					let t = e
						.unescape()
						.unwrap_or_default()
						.to_string();
					text.push_str(&t);
					paragraph_has_text = true;
				}
			}
			Ok(quick_xml::events::Event::End(ref e)) => {
				if e.local_name().as_ref() == b"t" {
					in_text_element = false;
				} else if e.local_name().as_ref() == b"p" {
					// Will add newline at next paragraph start
				}
			}
			Ok(quick_xml::events::Event::Eof) => break,
			Err(e) => return Err(format!("XML parse error: {e}")),
			_ => {}
		}
	}

	// Final newline if last paragraph had text
	if paragraph_has_text && !text.ends_with('\n') {
		text.push('\n');
	}

	Ok(ParsedText { text })
}

// ── Helpers ────────────────────────────────────────────

fn mime_from_ext(path: &Path) -> String {
	let ext = path
		.extension()
		.and_then(|e| e.to_str())
		.unwrap_or("")
		.to_lowercase();

	match ext.as_str() {
		"jpg" | "jpeg" => "image/jpeg",
		"png" => "image/png",
		"webp" => "image/webp",
		"heic" => "image/heic",
		"heif" => "image/heif",
		"pdf" => "application/pdf",
		"xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"xls" => "application/vnd.ms-excel",
		"csv" => "text/csv",
		"docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"doc" => "application/msword",
		_ => "application/octet-stream",
	}
	.to_string()
}
