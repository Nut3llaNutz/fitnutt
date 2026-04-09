import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFoods } from "@/hooks/useFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ScanBarcode, RotateCcw, CheckCircle2, Loader2, AlertTriangle, Keyboard, Camera } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useAuth } from "@/contexts/AuthContext";
import { Nut3llaPrompt } from "@/components/Nut3llaPrompt";

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
  const { isGuest } = useAuth();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [lastBarcode, setLastBarcode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  
  const [form, setForm] = useState<FoodForm>({
    name: "", serving_size: 100, serving_unit: "g",
    calories: "", protein: "", carbs: "", fats: "",
  });

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    await stopScanner();
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

    try {
      // Ensure any previous instance is stopped
      await stopScanner();

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        // Removing qrbox here suppresses the library's default UI overlay
        // We handle the visual ROI with our own React overlay for a premium look
        aspectRatio: 1.333333,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success!
          handleBarcodeScanned(decodedText);
        },
        undefined // Success handled, errors ignored per frame
      );
    } catch (e: any) {
      console.error("Camera error:", e);
      setErrorMsg(e.message || "Could not access camera");
      setScanState("error");
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }

    addFood.mutate(
      {
        name: form.name,
        serving_size: Number(form.serving_size) || 100,
        serving_unit: form.serving_unit,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fats: Number(form.fats) || 0,
        category: "Meals",
        is_veg: true,
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
    <div className="flex flex-col space-y-4">
      {/* Internal Page Header */}
      <div className="flex items-center gap-3 px-1 pt-2">
        <button onClick={() => { stopScanner(); navigate("/foods"); }} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Barcode Scanner</h1>
      </div>

      <main className="flex-1 flex flex-col items-center justify-start pt-4 px-4 pb-8 max-w-lg mx-auto w-full space-y-4">

        {/* Camera Viewfinder */}
        {(scanState === "scanning" || (scanState === "loading" && manualCode === "")) && (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-lg border border-border">
            <div id="reader" className="w-full h-full"></div>

            {scanState === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-[250px] h-[150px] relative">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md" />
                  <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary/70 animate-scan-line" />
                </div>
                <p className="absolute bottom-4 text-white/90 text-sm font-medium drop-shadow-lg text-center px-4 bg-black/40 py-1 rounded-full backdrop-blur-sm">
                  Align barcode within the frame
                </p>
              </div>
            )}

            {scanState === "loading" && (
              <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-white font-medium">Fetching nutrition data…</p>
              </div>
            )}
            
            {scanState === "scanning" && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-3 right-3 z-20 opacity-90 backdrop-blur-md shadow-md"
                onClick={() => { stopScanner(); setScanState("manual_entry"); }}
              >
                <Keyboard className="w-4 h-4 mr-2" /> Type Manually
              </Button>
            )}
          </div>
        )}

        {/* Manual Entry Flow */}
        {(scanState === "manual_entry" || (scanState === "loading" && manualCode !== "")) && (
          <div className="w-full bg-card rounded-2xl p-6 border border-border shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Keyboard className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-xl text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Manual Entry</p>
              <p className="text-sm text-muted-foreground">
                Enter the numerical code found directly under the barcode lines.
              </p>
            </div>
            
            <div className="space-y-4 pt-2">
              <Input 
                placeholder="e.g. 502011000213" 
                type="number"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-center text-xl tracking-[0.2em] font-mono h-14 bg-background"
                disabled={scanState === "loading"}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={startScanner} disabled={scanState === "loading"}>
                  <Camera className="w-4 h-4 mr-2" /> Camera
                </Button>
                <Button className="flex-1" disabled={manualCode.length < 5 || scanState === "loading"} onClick={submitManualCode}>
                  {scanState === "loading" ? <Loader2 className="animate-spin h-4 w-4" /> : "Search Food"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {scanState === "not_found" && (
          <div className="w-full bg-card rounded-2xl p-6 text-center shadow-xl border border-border animate-in zoom-in-95 duration-300 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ScanBarcode className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xl text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Product Not Found</p>
              <p className="text-sm text-muted-foreground px-4">
                We couldn't find this item in our database. You can try scanning again or add the details manually.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={startScanner}>
                <RotateCcw className="h-4 w-4 mr-2" /> Retry
              </Button>
              <Button className="flex-1" onClick={() => navigate("/foods")}>
                Add Manually
              </Button>
            </div>
          </div>
        )}

        {scanState === "error" && (
          <div className="w-full bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center shadow-xl animate-in shake-1 duration-500 space-y-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg text-foreground">Camera Access Required</p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Button variant="outline" className="w-full mt-2" onClick={() => setScanState("manual_entry")}>
              <Keyboard className="h-4 w-4 mr-2" /> Type Barcode instead
            </Button>
          </div>
        )}

        {scanState === "confirm" && (
          <div className="w-full bg-card rounded-2xl p-6 space-y-6 border border-border shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">Found it!</p>
                <p className="text-xs text-muted-foreground">Adjust details if needed.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Size</label>
                  <Input type="number" value={form.serving_size} onChange={(e) => setForm({ ...form, serving_size: e.target.value === "" ? "" : parseFloat(e.target.value) })} className="bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Unit</label>
                  <Input value={form.serving_unit} onChange={(e) => setForm({ ...form, serving_unit: e.target.value })} className="bg-background" />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Nutrition (per serving)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase pl-1">Calories</label>
                    <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value === "" ? "" : parseFloat(e.target.value) })} className="h-9 bg-background" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase pl-1">Protein (g)</label>
                    <Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value === "" ? "" : parseFloat(e.target.value) })} className="h-9 bg-background" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase pl-1">Carbs (g)</label>
                    <Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value === "" ? "" : parseFloat(e.target.value) })} className="h-9 bg-background" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase pl-1">Fats (g)</label>
                    <Input type="number" value={form.fats} onChange={(e) => setForm({ ...form, fats: e.target.value === "" ? "" : parseFloat(e.target.value) })} className="h-9 bg-background" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12" onClick={startScanner}>
                <RotateCcw className="h-4 w-4 mr-2" /> Rescan
              </Button>
              <Button className="flex-1 h-12 shadow-lg shadow-primary/20" onClick={handleSave} disabled={!form.name}>
                Save to Library
              </Button>
            </div>
          </div>
        )}
      </main>

      {showGuestPrompt && (
        <Nut3llaPrompt 
          description="You can scan anything to check its fuel content, but to save it to your permanent library, you'll need to join the Nut3lla Protocol."
          onClose={() => setShowGuestPrompt(false)}
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
