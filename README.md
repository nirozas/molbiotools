# MHC-Predictor: Expert Bioinformatics Solution

This project provides a professional-grade web application for predicting and visualizing MHC-I and MHC-II peptide binders using the NetMHCpan-4.1 and NetMHCIIpan-4.3 algorithms.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)

### 2. Backend Setup
1.  Navigate to the `backend/` directory.
2.  Install dependencies:
    ```bash
    npm install express cors axios cheerio body-parser dotenv
    ```
3.  Ensure the allele list files (`mhci_alleles.txt` and `mhcii_alleles.txt`) are present in the same directory.
4.  Launch the server:
    ```bash
    node server.js
    ```
    *The server will run on [http://localhost:3001](http://localhost:3001).*

### 3. Frontend Setup
1.  Navigate to the `frontend/` directory.
2.  Install dependencies:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
    *The app will be available at [http://localhost:3000](http://localhost:3000).*

## 🧬 Key Features & Implementation

### 1. Advanced Sequence Viewer (SVG/Grid)
The **Sequence Viewer Component** is built using a dynamic CSS Grid track system. It maps each amino acid to a unique horizontal track and visualizes predicted peptides as overlapping, color-coded bars:
-   **Emerald-500**: Strong Binders (Rank < 0.5% for MHC-I, < 1.0% for MHC-II).
-   **Amber-500**: Weak Binders (Rank up to 2.0% for MHC-I, 5.0% for MHC-II).
-   **Interactivity**: Hovering over any peptide bar reveals a detailed tooltip with its sequence, % Rank, affinity score, and the specific allele.

### 2. Intelligent Input Form
-   **Auto-Translation**: DNA sequences (A, T, C, G) are automatically detected and translated into protein sequences using the standard genetic code.
-   **Organism-Aware Filtering**: Selecting an organism (e.g., Human) dynamically restricts the allele autocomplete dropdown to relevant prefixes (e.g., HLA).
-   **MHC Class Logic**: Toggling between MHC Class I and II automatically updates:
    *   **Peptide Lengths**: 8-11 for MHC-I, 13-16 for MHC-II.
    *   **Binding Thresholds**: Defaults updated to community standards.
    *   **Allele Lists**: Swapping between Class-I and Class-II allele sets.

### 3. Backend Proxy Logic
Since DTU Health Tech services lack a direct REST API, the backend implements a **multipart/form-data simulator**:
1.  **Job Submission**: The backend simulates a browser POST to `webface2.cgi`.
2.  **Parsing Engine**: Utilizes a text-based parser for the standard NetMHCpan output format, converting raw tables into a clean JSON structure.
3.  **JSON Payload**: Returns an array of hit objects with start/end positions, scores, and binder classifications.

## 🛠 Project Structure

```text
├── backend/
│   ├── server.js           # API endpoints & prediction logic
│   ├── translation.js      # DNA to Protein translation engine
│   ├── mhci_alleles.txt    # MHC-I allele reference (11k+ entries)
│   └── mhcii_alleles.txt   # MHC-II allele reference (11k+ entries)
└── frontend/
    ├── src/app/            # Next.js App Router files
    └── src/components/     # UI Components
        ├── MainApp.tsx      # Application layout & state
        ├── AnalysisForm.tsx # Dynamic input handling
        └── MHCVisualizer.tsx # SVG/Grid sequence visualization
```
