#!/bin/bash

# Define the modules list
# Módulos: 'Auth', 'Users', 'Academy', 'Classroom', 'Community'
MODULES=("auth" "users" "academy" "classroom" "community")

# Define base directory (assuming we are in the project root)
BASE_DIR="src"

echo "Scaffolding NestJS Domain-Driven Design Structure..."

for MODULE in "${MODULES[@]}"; do
  # Convert module name to PascalCase for the class name (e.g., auth -> Auth)
  # Bash 4.0+ feature for capitalization
  MODULE_CLASS="${MODULE^}"
  
  # Create directory structure
  mkdir -p "$BASE_DIR/$MODULE/dto"
  mkdir -p "$BASE_DIR/$MODULE/entities"
  mkdir -p "$BASE_DIR/$MODULE/controllers"
  mkdir -p "$BASE_DIR/$MODULE/services"
  
  echo "Created directories for $MODULE_CLASS"

  # Create the module file if it doesn't exist
  MODULE_FILE="$BASE_DIR/$MODULE/$MODULE.module.ts"
  
  if [ ! -f "$MODULE_FILE" ]; then
    cat <<EOF > "$MODULE_FILE"
import { Module } from '@nestjs/common';

@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class ${MODULE_CLASS}Module {}
EOF
    echo "Created $MODULE_FILE"
  else
    echo "Skipped $MODULE_FILE (already exists)"
  fi

done

echo "✅ Structure created successfully!"
