package com.letsign.mobile.presentation.ui.screens.documents

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.spacedBy
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filed.Description
import androidx.compose.material.icons.filed.FileDownload
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.PendingActions
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filed.Close
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.letsign.mobile.domain.model.Document
import com.letsign.mobile.domain.model.DocumentStatus
import com.letsign.mobile.presentation.ui.components.DocumentStatusChip
import com.letsign.mobile.presentation.ui.components.LoadingOverlay
import com.letsign.mobile.presentation.ui.components.LetsSignTopAppBar
import com.letsign.mobile.presentation.viewmodel.DocumentViewModel
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.flow.collectAsStateWithLifecycle

@Composable
fun DocumentListScreen(
    onNavigateToNew: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    viewModel: DocumentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            LetsSignTopAppBar(
                title = "Meus Documentos",
                actions = {
                    androidx.compose.material3.IconButton(onClick = onNavigateToNew) {
                        Icon(Icons.Default.Add, contentDescription = "Novo documento", tint = Color.White)
                    }
                }
            )

            if (uiState.isLoading) {
                LoadingOverlay(true)
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 16.dp)
                ) {
                    items(uiState.documents) { document ->
                        DocumentCard(document = document, onClick = { onNavigateToDetail(document.id) })
                    }
                }
            }
        }

        LoadingOverlay(uiState.isLoading)
    }
}

@Composable
fun DocumentCard(
    document: Document,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight()
            .onClick { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Card(
                        modifier = Modifier.size(48.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color(0xFFE8EAF6)
                        )
                    ) {
                        Icon(
                            Icons.Default.Description,
                            contentDescription = null,
                            tint = Color(0xFF3F51B5),
                            modifier = Modifier.size(24.dp).padding(12.dp)
                        )
                    }
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(12.dp))
                    Column(crossAxisAlignment = Alignment.Start) {
                        Text(text = document.titulo, fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(text = "${document.nomeArquivo} • ${document.totalPaginas} pág.", fontSize = 12.sp, color = Color(0xFF757575))
                    }
                }
                DocumentStatusChip(document.status)
            }

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Criado em ${formatDate(document.criadoEm)}", fontSize = 12.sp, color = Color(0xFF9E9E9E))
                if (document.totalSignatarios != null) {
                    Text(text = "${document.assinados ?: 0}/${document.totalSignatarios} assinaturas", fontSize = 12.sp, color = Color(0xFF757575))
                }
            }
        }
    }
}

@Composable
fun DocumentDetailScreen(
    documentId: String,
    onNavigateBack: () -> Unit,
    onNavigateToEdit: () -> Unit,
    onDownloadPdf: (String, String) -> Unit,
    viewModel: DocumentViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            LetsSignTopAppBar(
                title = uiState.currentDocument?.titulo ?: "Documento",
                showBackButton = true,
                onBackClick = onNavigateBack,
                actions = {
                    if (uiState.currentDocument?.status == DocumentStatus.DRAFT) {
                        androidx.compose.material3.IconButton(onClick = onNavigateToEdit) {
                            Icon(Icons.Default.Edit, contentDescription = "Editar", tint = Color.White)
                        }
                    }
                    if (uiState.currentDocument?.status == DocumentStatus.COMPLETED || uiState.currentDocument?.status == DocumentStatus.PARTIALLY_SIGNED) {
                        androidx.compose.material3.IconButton(onClick = { onDownloadPdf(documentId, "final") }) {
                            Icon(Icons.Default.FileDownload, contentDescription = "Baixar PDF final", tint = Color.White)
                        }
                        androidx.compose.material3.IconButton(onClick = { onDownloadPdf(documentId, "original") }) {
                            Icon(Icons.Default.FileDownload, contentDescription = "Baixar Original", tint = Color.White)
                        }
                    }
                }
            )

            if (uiState.isLoading) {
                LoadingOverlay(true)
            } else if (uiState.currentDocument != null) {
                DocumentDetailContent(
                    document = uiState.currentDocument!!,
                    participants = uiState.participants,
                    fields = uiState.fields,
                    onSign = { base64 -> viewModel.signDocument(documentId, base64, "") },
                    onReject = { motivo -> viewModel.rejectDocument(documentId, motivo) },
                    onDownloadOriginal = { onDownloadPdf(documentId, "original") },
                    onDownloadFinal = { onDownloadPdf(documentId, "final") }
                )
            }
        }

        LoadingOverlay(uiState.isLoading)
    }
}

@Composable
fun DocumentDetailContent(
    document: Document,
    participants: List<com.letsign.mobile.domain.model.Participant>,
    fields: List<com.letsign.mobile.domain.model.SignatureField>,
    onSign: (String) -> Unit,
    onReject: (String) -> Unit,
    onDownloadOriginal: () -> Unit,
    onDownloadFinal: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Document Info Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = document.titulo, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text(text = "${document.nomeArquivo} • ${document.totalPaginas} páginas", fontSize = 14.sp, color = Color(0xFF757575))
                    }
                    DocumentStatusChip(document.status)
                }

                Divider()

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "Versão ${document.versao}", fontSize = 14.sp)
                    Text(text = "Hash: ${document.hashSha256.take(16)}...", fontSize = 12.sp, color = Color(0xFF9E9E9E))
                }
            }
        }

        // Participants
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(text = "Participantes (${participants.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    participants.forEach { p ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Card(
                                    modifier = Modifier.size(36.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = Color(0xFFE8EAF6)
                                    )
                                ) {
                                    Text(
                                        text = p.signer?.nome?.firstOrNull()?.toString()?.uppercase() ?: "?",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF3F51B5),
                                        modifier = Modifier.fillMaxSize().padding(8.dp)
                                    )
                                }
                                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(12.dp))
                                Column(crossAxisAlignment = Alignment.Start) {
                                    Text(text = p.signer?.nome ?: "Carregando...", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                    Text(text = p.signer?.email ?: "", fontSize = 12.sp, color = Color(0xFF757575))
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                SignerStatusChip(p.status)
                                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(top = 4.dp))
                                if (p.required) {
                                    Text(text = "Obrigatório", fontSize = 10.sp, color = Color(0xFFC2185B), fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Fields
        if (fields.isNotEmpty()) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Campos de Assinatura (${fields.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        fields.forEach { f ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "Página ${f.page} • ${f.width} x ${f.height}", fontSize = 12.sp, color = Color(0xFF757575))
                                if (f.required) {
                                    Text(text = "Obrigatório", fontSize = 10.sp, color = Color(0xFFC2185B), fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Actions for signers
        // Would need current user role check here
    }
}

// Helper imports
import androidx.compose.foundation.layout.Divider
import androidx.compose.material3.Divider
import androidx.compose.material3.Divider
import com.letsign.mobile.domain.model.DocumentStatus
import com.letsign.mobile.presentation.ui.components.DocumentStatusChip