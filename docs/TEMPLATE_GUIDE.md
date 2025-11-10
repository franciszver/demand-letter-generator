# Template Creation Guide

## Overview

Templates allow you to create reusable demand letter structures with variable placeholders that are automatically filled during letter generation.

## Template Syntax

Use double curly braces to define variables:

```
{{variable_name}}
```

## Common Variables

### Standard Variables (Auto-filled)
- `{{date}}` - Current date
- `{{current_date}}` - Current date (alternative)

### Document-Derived Variables
These are extracted from uploaded documents:
- `{{client_name}}` - Client name
- `{{opposing_party}}` - Opposing party name
- `{{case_number}}` - Case number (if available)
- `{{amount}}` - Claimed amount
- `{{incident_date}}` - Date of incident

## Creating a Template

### Step 1: Access Template Manager

1. Navigate to the Home page
2. Scroll to the Templates section
3. Click "Create Template"

### Step 2: Define Template Structure

Enter your template content with variables:

```
RE: Demand Letter - {{case_number}}

Dear {{opposing_party}},

This letter is written on behalf of {{client_name}} regarding the incident that occurred on {{incident_date}}.

Based on our review of the facts, we are demanding the sum of {{amount}} to resolve this matter.

Please respond within 14 days of the date of this letter ({{date}}).

Sincerely,
[Attorney Name]
```

### Step 3: Save Template

1. Enter a descriptive name
2. Review variables (auto-detected)
3. Click "Create"

## Template Examples

### Basic Demand Letter
```
RE: Demand for Payment

Dear {{opposing_party}},

We represent {{client_name}} in connection with the above-referenced matter.

On {{incident_date}}, [description of incident].

We demand payment in the amount of {{amount}} within 14 days.

Sincerely,
[Your Name]
```

### Formal Demand Letter
```
{{date}}

{{opposing_party}}
[Address]

RE: Demand Letter - Case No. {{case_number}}

Dear Sir/Madam,

This firm represents {{client_name}} in the above-referenced matter.

[Body content]

We demand immediate payment of {{amount}}.

Very truly yours,
[Attorney Name]
[Firm Name]
```

## Tips

1. **Be Specific**: Use clear variable names that describe their purpose
2. **Test Templates**: Create a test letter to verify variable replacement
3. **Version Control**: Templates support versioning - old versions are preserved
4. **Firm Standards**: Create templates that match your firm's letter format
5. **Variable Extraction**: Variables are automatically extracted from template content

## Variable Naming Best Practices

- Use lowercase with underscores: `client_name` not `ClientName`
- Be descriptive: `incident_date` not `date1`
- Use consistent naming across templates
- Document custom variables in template name or description

## Editing Templates

1. Click "Edit" on any template
2. Modify content or variables
3. Click "Update"
4. New version is created automatically

## Using Templates

1. During letter generation, select a template from the dropdown
2. AI will use the template structure
3. Variables are filled with information from uploaded documents
4. Final letter follows template format

## Limitations

- Variables must be in `{{variable_name}}` format
- Maximum template size: 10,000 characters
- Variables are case-sensitive
- Template content is plain text (no rich formatting)

