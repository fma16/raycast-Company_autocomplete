# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with Raycast
- `npm run build` - Build the extension
- `npm run lint` - Run ESLint
- `npm run fix-lint` - Run ESLint with auto-fix
- `npm run publish` - Publish to Raycast Store

## Architecture Overview

This is a Raycast extension for fetching French company information from the INPI (Institut National de la Propriété Industrielle) API using SIREN/SIRET numbers. The extension formats company data into standardized legal contract language in French.

### Core Components

**Main Entry Point (`src/index.tsx`)**
- `SearchForm` - Input form for SIREN/SIRET numbers with validation
- `CompanyDetail` - Displays formatted company information with metadata and copy functionality
- `buildMarkdown` - Generates formatted legal text for contract integration
- `Metadata` - Structured display of key company information

**API Layer (`src/api.ts`)**
- `login()` - Authenticates with INPI API using Bearer token authentication
- `getCompanyInfo()` - Fetches company data by SIREN number with 404 error handling
- Base URL: `https://registre-national-entreprises.inpi.fr`
- Endpoints: `/api/sso/login`, `/api/companies/{siren}`

**Data Processing (`src/utils.ts`)**
- `validateAndExtractSiren()` - Validates and extracts SIREN from input (handles both 9-digit SIREN and 14-digit SIRET)
- `formatRepresentative()` - Finds primary legal representative (prioritizes Président, Gérant, Directeur général)
- `formatAddress()` - Constructs French address format from optional fields
- `getGenderAgreement()` - Handles French grammatical gender agreement for legal terms
- `formatField()` - Handles null/undefined values with fallback (`[À COMPLÉTER]`)

**Types (`src/types.ts`)**
- `CompanyData` - Complete INPI API response structure
- `Representative` - Director/manager information with role hierarchy
- `Preferences` - Extension configuration for API credentials

## INPI API Structure

### Authentication Flow
1. POST `/api/sso/login` with username/password credentials
2. API returns JWT/bearer token
3. Include `Authorization: Bearer {token}` header in subsequent requests

### Company Data Fields

**Core Company Information:**
- `siren` - 9-digit company identifier
- `personneMorale.denomination` - Company name
- `personneMorale.formeJuridique` - Legal form (SARL, SAS, SA, etc.)
- `personneMorale.capital.montant` - Share capital amount

**Registration Details:**
- `personneMorale.immatriculationRcs.numeroRcs` - RCS registration number
- `personneMorale.immatriculationRcs.villeImmatriculation` - RCS registration city

**Address Structure (all optional):**
- `adresseEntreprise.numeroVoie` - Street number
- `adresseEntreprise.typeVoie` - Street type (rue, avenue, etc.)
- `adresseEntreprise.libelleVoie` - Street name
- `adresseEntreprise.codePostal` - Postal code
- `adresseEntreprise.commune` - City/commune

**Management Information:**
- `personneMorale.dirigeants[]` - Array of company representatives
- Representative roles: Président, Gérant, Directeur général (in priority order)
- Gender field for French grammatical agreement: 'M'/'F'

### Error Handling Patterns
- **404**: Company not found for SIREN
- **Authentication errors**: Invalid credentials or expired tokens
- **Missing data**: Graceful degradation with `[À COMPLÉTER]` fallbacks
- **Partial data**: Handle cases where `personneMorale` is missing

### Key Features

- SIREN/SIRET validation and normalization
- Token-based authentication with INPI API
- Legal representative identification with role hierarchy
- French legal document formatting with proper grammar
- Comprehensive fallback handling for missing data
- Copy-to-clipboard functionality for generated legal text

### Configuration

The extension requires INPI API credentials configured in Raycast preferences:
- `inpiUsername` - INPI API username
- `inpiPassword` - INPI API password (stored securely)

### Output Format

Generates standardized French legal text suitable for contract party designation sections:
```
La société [DENOMINATION]
[FORME JURIDIQUE] au capital de [CAPITAL] €
Immatriculée au RCS de [VILLE] sous le n° [NUMERO_RCS]
Dont le siège social est situé [ADRESSE]
Représentée aux fins des présentes par [REPRESENTANT] en sa qualité de [ROLE], dûment [habilité/habilitée].
```

## Documentation de référence

- **Documentation Raycast :** [https://developers.raycast.com](https://developers.raycast.com/)
- **Documentation technique API RNE :** [https://www.inpi.fr/sites/default/files/2025-06/documentation%20technique%20API%20formalit%C3%A9s_v4.0.pdf](https://www.inpi.fr/sites/default/files/2025-06/documentation%20technique%20API%20formalit%C3%A9s_v4.0.pdf)
- **Dictionnaire des variables :** [https://www.inpi.fr/sites/default/files/2025-06/Dictionnaire_de_donnees_INPI_2025_05_09.xlsx](https://www.inpi.fr/sites/default/files/2025-06/Dictionnaire_de_donnees_INPI_2025_05_09.xlsx)

## Development Notes

- **Language**: All responses and communications should be in French
- **API calls**: Each request must query the API directly - no caching of company data
- **Data format**: All data is in French, appropriate for French business registry
- **Token management**: Consider implementing token refresh for long-running use
- **Input validation**: Always validate SIREN format before API calls (9 digits numeric)
- **SIRET handling**: Extract first 9 digits as SIREN from 14-digit SIRET numbers