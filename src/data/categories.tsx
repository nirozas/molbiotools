import {
  Dna,
  Zap,
  Layers,
  FlaskConical,
  Microscope,
  Shield,
  Calculator,
  Atom,
} from "lucide-react";
import { Category } from "@/components/CategoryCard";

export const categories: Category[] = [
  {
    id: "dna",
    name: "DNA Tools",
    description: "Sequence analysis, restriction mapping, primer design, and CRISPR tools",
    colorClass: "cat-dna",
    icon: <Dna size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 22,
    subcategories: [
      {
        name: "Sequence Analysis",
        tools: [
          { name: "Reverse Complement", description: "Generate reverse complement of a DNA sequence", type: "internal", href: "/tools/run/reverse-complement", badge: "NEW" },
          { name: "Gene Optimizer & Complexity", description: "Check synthesis complexity and optimize codons", type: "internal", href: "/tools/run/gene-optimizer", badge: "NEW" },
          { name: "Coding Capacity of DNA", description: "Convert between DNA length (bp), protein length (AA), and protein size (kDa)", type: "internal", href: "/tools/run/coding-capacity", badge: "NEW" },
          { name: "GC Content Calculator", description: "Calculate GC percentage and base composition", type: "internal", href: "/tools/run/gc-content" },
          { name: "Sequence Statistics", description: "Length, composition, and melting temperature", type: "internal", href: "/tools/run/sequence-statistics" },
          { name: "DNA Concentration Calculator", description: "A260 absorbance to ng/µL concentration", type: "internal", href: "/tools/run/dna-concentration-calculator" },
        ],
      },
      {
        name: "Restriction & Cloning",
        tools: [
          { name: "In-Silico PCR Simulator", description: "Predict amplicons and generate protocols/programs", type: "internal", href: "/tools/run/pcr-simulator", badge: "NEW" },
          { name: "Restriction Enzyme Analyzer", description: "Find restriction sites in your sequence", type: "internal", href: "/tools/run/restriction-enzyme-analyzer" },
          { name: "Restriction Digest & Gel", description: "Simulate digest and visualize on agarose gel", type: "internal", href: "/tools/run/restriction-digest", badge: "NEW" },
          { name: "Ligation Calculator", description: "Optimal insert:vector ratios", type: "internal", href: "/tools/run/ligation-calculator" },
          { name: "Primer Design (Primer3)", description: "Design PCR primers with Tm and GC balance", type: "external", href: "https://primer3.ut.ee/" },
        ],
      },
      {
        name: "CRISPR & Editing",
        tools: [
          { name: "CRISPR Guide RNA Designer", description: "Design sgRNA for Cas9 gene editing", type: "external", href: "https://chopchop.cbu.uib.no/" },
          { name: "Off-target Predictor", description: "Predict CRISPR off-target sites", type: "external", href: "https://cas-offinder.bioinformatics.kr/" },
        ],
      },
      {
        name: "Alignment & BLAST",
        tools: [
          { name: "BLAST (NCBI)", description: "Nucleotide BLAST sequence alignment", type: "external", href: "https://blast.ncbi.nlm.nih.gov/" },
          { name: "Pairwise Alignment", description: "Smith-Waterman & Needleman-Wunsch", type: "internal", href: "/tools/run/pairwise-alignment" },
        ],
      },
    ],
  },
  {
    id: "rna",
    name: "RNA Tools",
    description: "Transcription analysis, secondary structure, and RNA-seq utilities",
    colorClass: "cat-rna",
    icon: <Zap size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 14,
    subcategories: [
      {
        name: "Transcription",
        tools: [
          { name: "DNA to RNA Transcription", description: "Convert DNA template to mRNA sequence", type: "internal", href: "/tools/run/transcription" },
          { name: "ORF Finder", description: "Identify open reading frames in RNA", type: "internal", href: "/tools/run/orf-finder" },
          { name: "Codon Usage Table", description: "Analyze codon frequency in transcripts", type: "internal", href: "/tools/run/codon-usage" },
        ],
      },
      {
        name: "Structure & Folding",
        tools: [
          { name: "RNA Secondary Structure", description: "Predict mRNA folding and free energy (Mfold)", type: "external", href: "http://www.unafold.org/mfold/" },
          { name: "miRNA Target Predictor", description: "Find miRNA binding sites in 3' UTR", type: "external", href: "https://www.targetscan.org/" },
          { name: "mRNA Optimization", description: "Folding, stability & translation potential (via dichlab)", type: "internal", href: "/tools/run/mrna-optimization", badge: "NEW" },
        ],
      },
      {
        name: "Non-coding RNA",
        tools: [
          { name: "lncRNA Analysis", description: "Characterize long non-coding RNA features", type: "internal", href: "/tools/run/lncrna-analysis" },
          { name: "siRNA Designer", description: "Design effective siRNA for gene silencing", type: "internal", href: "/tools/run/sirna-designer", badge: "BETA" },
        ],
      },
    ],
  },
  {
    id: "protein",
    name: "Protein Tools",
    description: "Structure prediction, translation, motifs, and immunoinformatics",
    colorClass: "cat-protein",
    icon: <Layers size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 23,
    subcategories: [
      {
        name: "Translation",
        tools: [
          { name: "Protein Translation", description: "Translate coding sequence to amino acids", type: "internal", href: "/tools/run/translation" },
          { name: "Reverse Translation", description: "Reverse-translate protein to DNA (+ codon opt.)", type: "internal", href: "/tools/run/rev-trans", badge: "NEW" },
          { name: "AA Notation Converter", description: "Switch between 1-letter, 3-letter, and full name notations", type: "internal", href: "/tools/run/aa-converter", badge: "NEW" },
          { name: "Protein Property Visualizer", description: "Map RasMol colors, liability sites, and hydrophobicity on sequence", type: "internal", href: "/tools/run/protein-viewer", badge: "NEW" },
          { name: "Amino Acid Properties", description: "MW, pI, GRAVY score, extinction coefficient", type: "internal", href: "/tools/run/protein-stats" },
          { name: "Coding Capacity of DNA", description: "Convert between DNA length (bp), protein length (AA), and protein size (kDa)", type: "internal", href: "/tools/run/coding-capacity", badge: "NEW" },
        ],
      },
      {
        name: "Structure",
        tools: [
          { name: "AlphaFold Structure Viewer", description: "View AlphaFold2 predicted protein structures", type: "external", href: "https://alphafold.ebi.ac.uk/" },
          { name: "Secondary Structure Prediction", description: "Predict α-helices, β-sheets, coils", type: "external", href: "https://npsa-prabi.ibcp.fr/cgi-bin/npsa_automat.pl?page=npsa_sopma.html" },
          { name: "Signal Peptide Finder", description: "Detect N-terminal signal peptides (SignalP)", type: "external", href: "https://services.healthtech.dtu.dk/services/SignalP-6.0/" },
        ],
      },
      {
        name: "Mutagenesis",
        tools: [
          { name: "AA Silent Switch", description: "Find synonymous codon substitutions without AA change", type: "internal", href: "/tools/run/aa-silent-switch", badge: "NEW" },
          { name: "AA Switcher", description: "Switch AAs and see required nucleotide changes in DNA", type: "internal", href: "/tools/run/aa-switcher", badge: "NEW" },
          { name: "Silent Mutator", description: "Introduce silent mutations to remove restriction sites", type: "internal", href: "/tools/run/silent-mutator" },
        ],
      },
      {
        name: "Motifs & Domains",
        tools: [
          { name: "Motif Finder", description: "Search known protein motifs (PROSITE patterns)", type: "internal", href: "/tools/run/motif-finder" },
          { name: "Domain Architecture", description: "InterPro domain annotation", type: "external", href: "https://www.ebi.ac.uk/interpro/" },
          { name: "Transmembrane Helix Predictor", description: "TMHMM-based topology prediction", type: "external", href: "https://services.healthtech.dtu.dk/services/TMHMM-2.0/" },
        ],
      },
      {
        name: "MHC Peptide Binding",
        tools: [
          { name: "MHC-I Peptide Binder", description: "Predict HLA class I binding peptides (8–11-mers)", type: "internal", href: "/mhc", badge: "AI" },
          { name: "MHC-II Peptide Binder", description: "Predict HLA class II binding peptides (13–25-mers)", type: "internal", href: "/mhc", badge: "AI" },
          { name: "Epitope Conservation", description: "Assess peptide conservation across strains", type: "internal", href: "/tools/run/epitope-conservation" },
        ],
      },
    ],
  },
  {
    id: "metabolism",
    name: "Metabolism",
    description: "Metabolic pathway analysis, enzyme kinetics, and chemical calculations",
    colorClass: "cat-meta",
    icon: <FlaskConical size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 11,
    subcategories: [
      {
        name: "Pathway Analysis",
        tools: [
          { name: "KEGG Pathway Viewer", description: "Visualize metabolic pathways and reactions", type: "external", href: "https://www.kegg.jp/kegg/pathway.html" },
          { name: "Metabolite Identifier", description: "Search metabolites by name, formula, or InChI", type: "external", href: "https://hmdb.ca/" },
        ],
      },
      {
        name: "Enzyme Kinetics",
        tools: [
          { name: "Michaelis-Menten Fitter", description: "Fit Km and Vmax from substrate-velocity data", type: "python", href: "/tools/run/michaelis-menten-fitter" },
          { name: "Lineweaver-Burk Plot", description: "Generate double-reciprocal kinetic plots", type: "python", href: "/tools/run/lineweaver-burk-plot" },
        ],
      },
    ],
  },
  {
    id: "genomics",
    name: "Genomics",
    description: "Genome assembly, annotation, comparative genomics, and variant analysis",
    colorClass: "cat-genomics",
    icon: <Microscope size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 13,
    subcategories: [
      {
        name: "Assembly & Annotation",
        tools: [
          { name: "Gene Prediction (Augustus)", description: "Predict genes in eukaryotic genomes", type: "external", href: "https://bioinf.uni-greifswald.de/augustus/" },
          { name: "RepeatMasker Link", description: "Identify and mask repetitive elements", type: "external", href: "https://www.repeatmasker.org/" },
        ],
      },
      {
        name: "Comparative Genomics",
        tools: [
          { name: "Synteny Viewer", description: "Compare genomic regions across species", type: "external", href: "https://synteny.ncbr.muni.cz/" },
          { name: "Phylogenetic Tree Builder", description: "Maximum-likelihood tree with IQ-TREE", type: "external", href: "http://www.iqtree.org/" },
        ],
      },
      {
        name: "Variant Analysis",
        tools: [
          { name: "SNP Annotation", description: "Functionally annotate genetic variants", type: "external", href: "https://www.ensembl.org/Tools/VEP" },
          { name: "Population Genetics Stats", description: "Fst, Tajima's D, and diversity metrics", type: "r", href: "/tools/run/population-genetics-stats" },
        ],
      },
    ],
  },
  {
    id: "calculators",
    name: "Lab Calculators",
    description: "Essential lab math — concentrations, centrifugation, DNA/protein quantification",
    colorClass: "cat-calc",
    icon: <Calculator size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 9,
    subcategories: [
      {
        name: "PCR & Primers",
        tools: [
          { name: "Tm Calculator", description: "Melting temperature for oligonucleotides via nearest-neighbor thermodynamics", type: "internal", href: "/tools/run/tm-calculator", badge: "NEW" },
          { name: "Ta Calculator", description: "Optimal annealing temperature for two primers + insert size", type: "internal", href: "/tools/run/ta-calculator", badge: "NEW" },
          { name: "Coding Capacity of DNA", description: "Convert between DNA length (bp), protein length (AA), and protein size (kDa)", type: "internal", href: "/tools/run/coding-capacity", badge: "NEW" },
        ],
      },
      {
        name: "General Lab",
        tools: [
          { name: "Molarity Calculator", description: "Mass, MW and volume to molarity (M, mM, µM, nM)", type: "internal", href: "/tools/run/molarity-calculator", badge: "NEW" },
          { name: "Buffer Calculator", description: "Acid/Base quantities via Henderson-Hasselbalch", type: "internal", href: "/tools/run/buffer-calculator", badge: "NEW" },
          { name: "Centrifugation Calculator", description: "Convert RPM ↔ RCF with rotor radius", type: "internal", href: "/tools/run/centrifugation-calculator", badge: "NEW" },
          { name: "OD600 Cell Density", description: "Estimate cell density for E. coli, Yeast, and others", type: "internal", href: "/tools/run/od600-cell-density", badge: "NEW" },
          { name: "Serial Dilution Planner", description: "Design serial dilution schemes with step factor", type: "internal", href: "/tools/run/serial-dilution-planner", badge: "NEW" },
          { name: "Unit Converter (Biology)", description: "pmol/µg/µM conversions for nucleic acids & proteins", type: "internal", href: "/tools/run/unit-converter-biology", badge: "NEW" },
        ],
      },
    ],
  },
  {
    id: "immunology",
    name: "Immunology",
    description: "Epitope prediction, antibody design, and immune response analysis",
    colorClass: "cat-immuno",
    icon: <Shield size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 9,
    subcategories: [
      {
        name: "Epitope Prediction",
        tools: [
          { name: "B-cell Epitope Predictor", description: "Linear B-cell epitope identification", type: "internal", href: "/tools/run/b-cell-epitope-predictor" },
          { name: "T-cell Epitope Predictor", description: "MHC-restricted T-cell epitope screening", type: "internal", href: "/tools/run/t-cell-epitope-predictor" },
          { name: "IEDB Analysis (Link)", description: "Immune Epitope Database tools", type: "external", href: "https://tools.iedb.org/" },
        ],
      },
      {
        name: "Antibody Tools",
        tools: [
          { name: "Antibody Humanization", description: "CDR grafting and humanness scoring", type: "external", href: "#" },
          { name: "VDJ Recombination Analyzer", description: "Analyze immunoglobulin gene recombination", type: "python", href: "/tools/run/vdj-recombination-analyzer", badge: "BETA" },
        ],
      },
    ],
  },
  {
    id: "microbiome",
    name: "Microbiome & Ecology",
    description: "16S rRNA analysis, metagenomics, and microbial diversity metrics",
    colorClass: "cat-microbe",
    icon: <Atom size={26} style={{ color: "var(--cat-color)" }} />,
    totalTools: 7,
    subcategories: [
      {
        name: "16S rRNA Analysis",
        tools: [
          { name: "OTU Picker", description: "Cluster 16S reads into OTUs at 97% similarity", type: "external", href: "https://qiime2.org/" },
          { name: "Phyloseq Diversity", description: "Alpha/beta diversity from OTU tables", type: "r", href: "/tools/run/phyloseq-diversity" },
        ],
      },
      {
        name: "Metagenomics",
        tools: [
          { name: "Kraken2 Taxonomy", description: "Taxonomic classification of metagenomic reads", type: "external", href: "https://ccb.jhu.edu/software/kraken2/" },
          { name: "Functional Profiling", description: "HUMAnN3 pathway abundance from shotgun data", type: "external", href: "https://huttenhower.sph.harvard.edu/humann/" },
        ],
      },
    ],
  },
];
