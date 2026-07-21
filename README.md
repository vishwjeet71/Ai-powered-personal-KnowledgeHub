# AI-Powered Personal Knowledge Hub

This RAG application is designed to organize all your documents—such as PDFs, DOCX files, text files, and more—in one place. Whenever you need information, it retrieves the exact content you are looking for. This eliminates the burden of manually organizing files and reduces the time spent searching through documents.

### Features

* Provides grounded answers based only on your documents.
* Supports commonly used file formats such as PDF, DOCX, TXT, and more.
* Stores all data locally to ensure privacy and security.


### Project Structure

```
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                            Upload
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
       PDFs                  DOCX                  Website
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                     Knowledge Ingestion
                               │
          Extract text + metadata + structure
                               │
                               ▼
                   Knowledge Processing
          Clean → Chunk → Index → Store Metadata
                               │
                               ▼
                   Personal Knowledge Base
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
     Search Engine        AI Assistant         Knowledge Manager
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    User asks a question
                               │
                               ▼
                    Retrieval + Reasoning
                               │
                               ▼
      Answer + Sources + Related Documents + Actions
```