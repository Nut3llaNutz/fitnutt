import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ScanBarcode, RotateCcw, CheckCircle2, Loader2, AlertTriangle, Keyboard } from "lucide-react";

interface FoodForm {
  name: string;
  serving_size: number | "";
  serving_unit: string;
  calories: number | "";
  protein: number | "";
  carbs: number | "";
  fats: number | "";
}

type ScanState = "scanning" | "loading" | "confirm" | "not_found" | "error" | "manual_entry";

const BarcodeScanner = () => {
  const navigate = useNavigate();
  const { addFood } = useFoods();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number>(0);
  
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [lastBarcode, setLastBarcode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  const [hasNativeDetector, setHasNativeDetector] = useState<boolean>(true);
  
  const [form, setForm] = useState<FoodForm>({
    name: "", serving_size: 100, serving_unit: "g",
    calories: "", protein: "", carbs: "", fats: "",
  });

  const stopCamera = () => {
    if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    stopCamera();
    setScanState("loading");

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();

      if (data.status === 0 || !data.product) {
        setScanState("not_found");
        return;
      }

      const p = data.product;
      const n = p.nutriments || {};
      setForm({
        name: p.product_name || p.abbreviated_product_name || "Unknown Product",
        serving_size: p.serving_quantity ? parseFloat(p.serving_quantity) : 100,
        serving_unit: p.serving_quantity_unit || "g",
        calories: Math.round(n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0),
        protein: parseFloat((n["proteins_serving"] ?? n["proteins_100g"] ?? 0).toFixed(1)),
        carbs: parseFloat((n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? 0).toFixed(1)),
        fats: parseFloat((n["fat_serving"] ?? n["fat_100g"] ?? 0).toFixed(1)),
      });
      setScanState("confirm");
    } catch {
      setScanState("not_found");
    }
  };

  const submitManualCode = () => {
    if (!manualCode.trim()) return;
    setLastBarcode(manualCode);
    handleBarcodeScanned(manualCode.trim());
  };

  const startScanner = async () => {
    setScanState("scanning");
    setLastBarcode("");
    setErrorMsg("");

    // Check for native ML BarcodeDetector
    const win = window as any;
    if (!("BarcodeDetector" in win)) {
      setHasNativeDetector(false);
      return; // Stop here, UI will prompt manual entry
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 }
        }
      }).catch(() => 
        // Fallback to any camera
        navigator.mediaDevices.getUserMedia({ video: true })
      );

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new win.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"]
        });

        const scanFrame = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                toast({ title: "Scanner Beep!", description: `Found code: ${code}` });
                setLastBarcode(code);
                handleBarcodeScanned(code);
                return; // Stop animation loop
              }
            } catch (err) {
              // Ignore frame analysis errors
            }
          }
          frameIdRef.current = requestAnimationFrame(scanFrame);
        };
        
        scanFrame();
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      setErrorMsg(e.message || "Camera access denied");
      setScanState("error");
    }
  };

  useEffect(() => {
    startScanner();
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    addFood.mutate(
      {
        name: form.name,
        serving_size: Number(form.serving_size) || 100,
        serving_unit: form.serving_unit,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
        source: "barcode",
      },
      {
        onSuccess: () => {
          toast({ title: "Added to library! 🎉" });
          navigate("/foods");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => { stopCamera(); navigate("/foods"); }} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Barcode Scanner
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-4 px-4 pb-8 max-w-lg mx-auto w-full space-y-4">

        {/* Camera Viewfinder */}
        {(scanState === "scanning" || scanState === "loading") && hasNativeDetector && (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-lg">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

            {scanState === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-[250px] h-[150px] relative">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md" />
                  <span className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary/70 animate-pulse" />
                </div>
                <p className="absolute bottom-4 text-white/80 text-sm font-medium drop-shadow text-center px-4">
                  Point camera at a barcode
                </p>
              </div>
            )}

            {scanState === "loading" && (
              <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-white font-medium">Looking up product…</p>
              </div>
            )}
            
            {scanState === "scanning" && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-3 right-3 z-20 opacity-80 backdrop-blur-md"
                onClick={() => { stopCamera(); setScanState("manual_entry"); }}
              >
                <Keyboard className="w-4 h-4 mr-2" /> Type Manually
              </Button>
            )}
          </div>
        )}

        {/* Missing Support / Manual Entry Flow */}
        {(!hasNativeDetector || scanState === "manual_entry") && (
          <div className="w-full bg-card rounded-2xl p-5 border border-border shadow-md space-y-4">
            <div className="text-center space-y-2">
              <Keyboard className="h-10 w-10 mx-auto text-primary" />
              <p className="font-semibold text-lg text-foreground">Type Barcode Manually</p>
              <p className="text-sm text-muted-foreground">
                {!hasNativeDetector 
                  ? "Your browser does not support live ML scanning. Please type the numbers under the barcode."
                  : "Can't get it to focus? Type the numbers located directly under the barcode lines."}
              </p>
            </div>
            
            <div className="space-y-4 pt-2">
              <Input 
                placeholder="e.g. 502011000213" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-center text-lg tracking-widest font-mono"
              />
              <div className="flex gap-2">
                {hasNativeDetector && (
                  <Button variant="outline" className="flex-1" onClick={startScanner}>
                    <ScanBarcode className="w-4 h-4 mr-2" /> Use Camera
                  </Button>
                )}
                <Button className="flex-1" disabled={manualCode.length < 5} onClick={submitManualCode}>
                  Search Food
                </Button>
              </div>
            </div>
            
            {scanState === "loading" && (
              <div className="pt-2 flex flex-col items-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                <p className="text-sm">Looking it up...</p>
              </div>
            )}
          </div>
        )}

        {scanState === "not_found" && (
          <div className="w-full bg-card rounded-2xl p-5 text-center shadow-md space-y-3">
            <ScanBarcode className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-semibold text-foreground">Product not found</p>
            <p className="text-sm text-muted-foreground">This barcode isn't in the Open Food Facts database. You can add it manually instead.</p>
            <div className="flex gap-2 relative z-10">
              <Button variant="outline" className="flex-1" onClick={startScanner}>
                <RotateCcw className="h-4 w-4 mr-1" /> Retry
              </Button>
              <Button className="flex-1" onClick={() => navigate("/foods")}>
                Add to Library
              </Button>
            </div>
          </div>
        )}

        {scanState === "error" && (
          <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center shadow-md space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-red-500" />
            <p className="font-semibold text-red-500">Camera Error</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" className="w-full mt-2" onClick={() => setScanState("manual_entry")}>
              <Keyboard className="h-4 w-4 mr-1" /> Type Barcode Manually
            </Button>
          </div>
        )}

        {scanState === "confirm" && (
          <div className="w-full bg-card rounded-2xl p-5 space-y-4 border border-border shadow-md">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-semibold text-foreground">Product found! Review &amp; edit before saving.</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Food Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serving Size</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input type="number" value={form.serving_size} onChange={(e) => setForm({ ...form, serving_size: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  <Input value={form.serving_unit} onChange={(e) => setForm({ ...form, serving_unit: e.target.value })} placeholder="g, ml, piece…" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Macros per serving</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Calories (kcal)</label>
                    <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                    <Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                    <Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Fats (g)</label>
                    <Input type="number" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={startScanner}>
                <RotateCcw className="h-4 w-4 mr-1" /> Rescan
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={!form.name}>
                Save to Library
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BarcodeScanner;

