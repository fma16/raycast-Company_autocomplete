# Data Sources

This directory contains source data files used to build the greffe (court registry) index.

## 📁 Files

### `referentiel.csv` (Not included in repository)
- **Source**: [Datainfogreffe Référentiel Communes-Greffes](https://opendata.datainfogreffe.fr/explore/dataset/referentiel-communes-greffes/)
- **License**: Open License / Licence Ouverte
- **Purpose**: Maps French postal codes to their corresponding commercial court registries
- **Format**: CSV with semicolon separator
- **Required columns**:
  - `Code postal`: 5-digit postal code
  - `Greffe`: Name of the court registry
  - `Code commune`: INSEE commune code (optional)
  - `Commune`: Commune name (optional)

## 🔄 Updating Data

To update the greffe mappings with latest official data:

### 1. Download Source Data
```bash
# Visit the official data source
open https://opendata.datainfogreffe.fr/explore/dataset/referentiel-communes-greffes/

# Export as CSV with these settings:
# - Format: CSV
# - Separator: Semicolon (;)
# - Encoding: UTF-8
# - Include headers: Yes

# Save the downloaded file as:
# data/referentiel.csv
```

### 2. Rebuild Index Files
```bash
# Process CSV and generate optimized index files
npm run build-greffes

# This creates:
# - assets/greffes-index.json (full format)
# - assets/greffes-index-compressed.json (optimized format)
```

### 3. Validate Results
```bash
# Run tests to ensure data integrity
npm test

# Check compression statistics in build output
# Verify lookup performance meets targets (<10ms)
```

## 📊 Data Statistics

**Current optimized data (as of last update):**
- Original entries: 28,136 postal code mappings
- Compressed entries: 6,337 (77% reduction)
- File size: 251KB (84% reduction from 1.5MB)
- Unique greffes: ~140 court registries
- Lookup performance: <0.01ms average

## 🚨 Important Notes

- **Do not commit** the `referentiel.csv` file to the repository
- The file can be large (several MB) and changes infrequently
- Always validate compression results before deploying
- The compressed format maintains 100% accuracy with the original data
- Update quarterly or when notified of significant changes to court jurisdictions

## 🔍 Data Quality

The build process includes automatic validation:
- ✅ **Format validation**: Ensures postal codes are 5 digits
- ✅ **Completeness check**: Warns about missing required fields
- ✅ **Compression integrity**: Validates compressed data matches original
- ✅ **Performance benchmarks**: Ensures lookup times meet targets

## 📞 Support

If you encounter issues with data updates:
1. Check the [official data source](https://opendata.datainfogreffe.fr/) for any format changes
2. Verify CSV export settings match requirements above
3. Review build logs for specific error messages
4. Test with a subset of data to isolate issues