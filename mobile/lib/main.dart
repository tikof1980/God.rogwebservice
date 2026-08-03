import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

// URL publique de production du frontend Next.js (à adapter une fois le
// domaine réel en place — voir k8s/40-ingress.yaml et docker-compose.yml
// pour la même valeur côté déploiement).
const String kAppUrl = 'https://app.rogwebservice.ci';

const Color kInk = Color(0xFF0B0F16);
const Color kGold = Color(0xFFD4A643);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: kInk,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const RogwebApp());
}

class RogwebApp extends StatelessWidget {
  const RogwebApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GOD.ROGWEBSERVICE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: kInk,
        colorScheme: const ColorScheme.dark(primary: kGold),
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(kInk)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() {
            _loading = true;
            _hasError = false;
          }),
          onPageFinished: (_) => setState(() => _loading = false),
          onWebResourceError: (_) => setState(() {
            _loading = false;
            _hasError = true;
          }),
          // Les liens tel:, mailto: et WhatsApp s'ouvrent dans l'app
          // native correspondante plutôt que dans la WebView.
          onNavigationRequest: (request) {
            final uri = Uri.parse(request.url);
            if (uri.scheme == 'tel' || uri.scheme == 'mailto' || uri.host.contains('wa.me')) {
              launchUrl(uri, mode: LaunchMode.externalApplication);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(kAppUrl));
  }

  Future<bool> _handleBack() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
      return false;
    }
    return true;
  }

  Future<void> _checkConnectivityAndRetry() async {
    final result = await Connectivity().checkConnectivity();
    if (result != ConnectivityResult.none) {
      _controller.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final shouldPop = await _handleBack();
        if (shouldPop && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: kInk,
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_loading && !_hasError)
                const Center(child: CircularProgressIndicator(color: kGold)),
              if (_hasError) _buildErrorState(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      color: kInk,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: Colors.white54, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Connexion impossible.\nVérifiez votre connexion internet.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _checkConnectivityAndRetry,
              style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kInk),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}
