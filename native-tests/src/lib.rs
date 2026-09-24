// Exercise the exact installed backend source without requiring a desktop WebView.
#[path = "../../src-tauri/src/store.rs"]
pub mod store;
#[cfg(test)]
#[path = "../../src-tauri/src/tests.rs"]
mod tests;
