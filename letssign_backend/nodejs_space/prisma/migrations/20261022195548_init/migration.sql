-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "senhaHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "adminId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "user_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "hashSha256" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "totalPaginas" INTEGER NOT NULL,
    "pdf" BLOB NOT NULL,
    "pdfFinal" BLOB,
    "hashFinal" TEXT,
    "mensagem" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEm" DATETIME,
    "concluidoEm" DATETIME,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "pdf" BLOB NOT NULL,
    "configuracao" JSONB,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documentversion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signaturefield" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "roleLabel" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signaturefield_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "signaturefield_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentsigner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "roleLabel" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "invitedAt" DATETIME,
    "viewedAt" DATETIME,
    "signedAt" DATETIME,
    "rejectedAt" DATETIME,
    "motivoRecusa" TEXT,
    "assinaturaImagemBase64" TEXT,
    "gestureMetadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "documentsigner_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documentsigner_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auditevent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "descricao" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "hashDocumentoNoMomento" TEXT,
    "metadados" JSONB,
    CONSTRAINT "auditevent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_adminId_idx" ON "user"("adminId");

-- CreateIndex
CREATE INDEX "document_ownerId_status_idx" ON "document"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "documentversion_documentId_versao_key" ON "documentversion"("documentId", "versao");

-- CreateIndex
CREATE INDEX "signaturefield_documentId_idx" ON "signaturefield"("documentId");

-- CreateIndex
CREATE INDEX "signaturefield_signerId_idx" ON "signaturefield"("signerId");

-- CreateIndex
CREATE INDEX "documentsigner_signerId_status_idx" ON "documentsigner"("signerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "documentsigner_documentId_signerId_key" ON "documentsigner"("documentId", "signerId");

-- CreateIndex
CREATE INDEX "auditevent_documentId_timestamp_idx" ON "auditevent"("documentId", "timestamp");
