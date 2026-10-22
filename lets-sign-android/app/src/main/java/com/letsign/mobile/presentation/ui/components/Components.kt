package com.letsign.mobile.presentation.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.Info
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LetsSignTopAppBar(
    title: String,
    showBackButton: Boolean = false,
    onBackClick: () -> Unit = {},
    actions: @Composable () -> Unit = {}
) {
    TopAppBar(
        title = { Text(text = title, fontWeight = FontWeight.Bold, color = Color.White) },
        navigationIcon = if (showBackButton) {
            @Composable {
                IconButton(onClick = onBackClick) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = Color.White)
                }
            }
        } else null,
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFFC2185B),
            titleContentColor = Color.White,
            navigationIconContentColor = Color.White,
            actionIconContentColor = Color.White
        ),
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
fun StatusBadge(
    text: String,
    color: androidx.compose.ui.graphics.Color = androidx.compose.ui.graphics.Color(0xFFC2185B),
    textColor: androidx.compose.ui.graphics.Color = androidx.compose.ui.graphics.Color.White
) {
    androidx.compose.material3.Text(
        text = text,
        color = textColor,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        modifier = Modifier
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .background(color, shape = RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    )
}

@Composable
fun DocumentStatusChip(status: com.letsign.mobile.domain.model.DocumentStatus) {
    val (text, color) = when (status) {
        com.letsign.mobile.domain.model.DocumentStatus.DRAFT -> "Rascunho" to Color(0xFF9E9E9E)
        com.letsign.mobile.domain.model.DocumentStatus.PENDING -> "Pendente" to Color(0xFFFFC107)
        com.letsign.mobile.domain.model.DocumentStatus.PARTIALLY_SIGNED -> "Parcial" to Color(0xFFF57C00)
        com.letsign.mobile.domain.model.DocumentStatus.COMPLETED -> "Concluído" to Color(0xFF4CAF50)
        com.letsign.mobile.domain.model.DocumentStatus.CANCELLED -> "Cancelado" to Color(0xFFF44336)
    }
    StatusBadge(text = text, color = color)
}

@Composable
fun SignerStatusChip(status: com.letsign.mobile.domain.model.SignerStatus) {
    val (text, color) = when (status) {
        com.letsign.mobile.domain.model.SignerStatus.PENDING -> "Pendente" to Color(0xFF2196F3)
        com.letsign.mobile.domain.model.SignerStatus.VIEWED -> "Visualizado" to Color(0xFFFF9800)
        com.letsign.mobile.domain.model.SignerStatus.SIGNED -> "Assinado" to Color(0xFF4CAF50)
        com.letsign.mobile.domain.model.SignerStatus.REJECTED -> "Recusado" to Color(0xFFF44336)
    }
    StatusBadge(text = text, color = color)
}

@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    subtitle: String,
    actionText: String? = null,
    onAction: (() -> Unit)? = null
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color(0xFFBDBDBD),
                modifier = Modifier.size(80.dp)
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
            Text(text = title, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF757575))
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Text(
                text = subtitle,
                fontSize = 14.sp,
                color = Color(0xFF9E9E9E),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 32.dp)
            )
            actionText?.let { text ->
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(24.dp))
                Button(onClick = onAction!!) {
                    Text(text = text)
                }
            }
        }
    }
}

@Composable
fun LoadingOverlay(isLoading: Boolean, message: String = "Carregando...") {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .padding(24.dp)
                    .background(Color.White, shape = RoundedCornerShape(16.dp))
                    .padding(24.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    androidx.compose.material3.CircularProgressIndicator(
                        color = Color(0xFFC2185B),
                        modifier = Modifier.size(40.dp)
                    )
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))
                    Text(text = message, fontSize = 16.sp, color = Color(0xFF424242))
                }
            }
        }
    }
}