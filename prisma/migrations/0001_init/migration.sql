-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('USER_CREATED', 'PASTED', 'IMPORTED_URL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "VersionKind" AS ENUM ('ORIGINAL', 'THRIVE');

-- CreateEnum
CREATE TYPE "ContentAudience" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TastePreference" AS ENUM ('PRESERVE', 'BALANCED', 'MAXIMUM');

-- CreateEnum
CREATE TYPE "TasteImpact" AS ENUM ('MINIMAL', 'MODERATE', 'SIGNIFICANT');

-- CreateEnum
CREATE TYPE "NutritionConfidence" AS ENUM ('HIGH', 'MODERATE', 'LOW');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('MEAL', 'CUISINE', 'NUTRITION_GOAL', 'COOKING_STYLE', 'DIETARY', 'COLLECTION_THEME');

-- CreateEnum
CREATE TYPE "ConversionJobStatus" AS ENUM ('QUEUED', 'READING', 'UNDERSTANDING', 'IMPROVING', 'ESTIMATING', 'PROTECTING', 'CREATING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "NutritionGoal" AS ENUM ('HEALTHIER_OVERALL', 'LOWER_CALORIES', 'HIGHER_PROTEIN', 'MORE_FIBER', 'LOWER_SATURATED_FAT', 'LOWER_SODIUM', 'LOWER_ADDED_SUGAR');

-- CreateEnum
CREATE TYPE "DietaryRequirement" AS ENUM ('VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT,
    "guestSessionId" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT,
    "sourceSite" TEXT,
    "sourceAuthor" TEXT,
    "originalTitle" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeDraft" (
    "id" TEXT NOT NULL,
    "guestSessionId" TEXT,
    "ownerId" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "servings" INTEGER,
    "prepMinutes" INTEGER,
    "cookMinutes" INTEGER,
    "cuisine" TEXT,
    "category" TEXT,
    "rawText" TEXT,
    "ingredientsJson" JSONB NOT NULL,
    "instructionsJson" JSONB NOT NULL,
    "extractionNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeVersion" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "kind" "VersionKind" NOT NULL,
    "audience" "ContentAudience" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "servings" INTEGER NOT NULL,
    "prepMinutes" INTEGER,
    "cookMinutes" INTEGER,
    "cuisine" TEXT,
    "tastePreference" "TastePreference",
    "tasteImpact" "TasteImpact",
    "goals" "NutritionGoal"[],
    "dietary" "DietaryRequirement"[],
    "searchText" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversionId" TEXT,

    CONSTRAINT "RecipeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "preparation" TEXT,
    "rawText" TEXT NOT NULL,
    "assumptionNote" TEXT,
    "fdcId" INTEGER,
    "mappingConfidence" DOUBLE PRECISION,
    "grams" DOUBLE PRECISION,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructionStep" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "InstructionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionEstimate" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "confidence" "NutritionConfidence" NOT NULL,
    "assumptionSummary" TEXT,
    "calories" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "saturatedFatG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "fiberG" DOUBLE PRECISION,
    "sugarG" DOUBLE PRECISION,
    "sodiumMg" DOUBLE PRECISION,
    "perServingCalories" DOUBLE PRECISION,
    "perServingProteinG" DOUBLE PRECISION,
    "perServingFatG" DOUBLE PRECISION,
    "perServingSaturatedFatG" DOUBLE PRECISION,
    "perServingCarbsG" DOUBLE PRECISION,
    "perServingFiberG" DOUBLE PRECISION,
    "perServingSugarG" DOUBLE PRECISION,
    "perServingSodiumMg" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'usda_fdc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversion" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "goals" "NutritionGoal"[],
    "dietary" "DietaryRequirement"[],
    "preference" "TastePreference" NOT NULL DEFAULT 'BALANCED',
    "model" TEXT NOT NULL,
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionChange" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "original" TEXT NOT NULL,
    "suggested" TEXT NOT NULL,
    "nutritionReason" TEXT NOT NULL,
    "flavorEffect" TEXT NOT NULL,
    "textureEffect" TEXT NOT NULL,

    CONSTRAINT "ConversionChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionJob" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT,
    "draftId" TEXT,
    "status" "ConversionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TagType" NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeTag" (
    "recipeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("recipeId","tagId")
);

-- CreateTable
CREATE TABLE "UrlExtractionCache" (
    "id" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "extractor" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrlExtractionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientMapping" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "fdcId" INTEGER NOT NULL,
    "matchQuality" DOUBLE PRECISION NOT NULL,
    "dataType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FdcFoodCache" (
    "fdcId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "nutrients" JSONB NOT NULL,
    "portions" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FdcFoodCache_pkey" PRIMARY KEY ("fdcId")
);

-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRecipe" (
    "collectionId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRecipe_pkey" PRIMARY KEY ("collectionId","recipeId")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "versionId" TEXT,
    "taste" INTEGER NOT NULL,
    "texture" INTEGER NOT NULL,
    "similarity" INTEGER NOT NULL,
    "ease" INTEGER NOT NULL,
    "wouldMakeAgain" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_ownerId_idx" ON "Recipe"("ownerId");

-- CreateIndex
CREATE INDEX "Recipe_guestSessionId_idx" ON "Recipe"("guestSessionId");

-- CreateIndex
CREATE INDEX "Recipe_visibility_idx" ON "Recipe"("visibility");

-- CreateIndex
CREATE INDEX "RecipeDraft_guestSessionId_idx" ON "RecipeDraft"("guestSessionId");

-- CreateIndex
CREATE INDEX "RecipeVersion_recipeId_kind_idx" ON "RecipeVersion"("recipeId", "kind");

-- CreateIndex
CREATE INDEX "RecipeVersion_audience_publishedAt_idx" ON "RecipeVersion"("audience", "publishedAt");

-- CreateIndex
CREATE INDEX "RecipeIngredient_versionId_idx" ON "RecipeIngredient"("versionId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_fdcId_idx" ON "RecipeIngredient"("fdcId");

-- CreateIndex
CREATE INDEX "InstructionStep_versionId_idx" ON "InstructionStep"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionEstimate_versionId_key" ON "NutritionEstimate"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionJob_conversionId_key" ON "ConversionJob"("conversionId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "RecipeTag_tagId_idx" ON "RecipeTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "UrlExtractionCache_canonicalUrl_key" ON "UrlExtractionCache"("canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientMapping_normalizedName_key" ON "IngredientMapping"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_recipeId_key" ON "Favorite"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_slug_key" ON "Collection"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_recipeId_key" ON "Rating"("userId", "recipeId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeVersion" ADD CONSTRAINT "RecipeVersion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeVersion" ADD CONSTRAINT "RecipeVersion_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RecipeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionStep" ADD CONSTRAINT "InstructionStep_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RecipeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionEstimate" ADD CONSTRAINT "NutritionEstimate_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RecipeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionChange" ADD CONSTRAINT "ConversionChange_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionJob" ADD CONSTRAINT "ConversionJob_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRecipe" ADD CONSTRAINT "CollectionRecipe_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRecipe" ADD CONSTRAINT "CollectionRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "RecipeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

