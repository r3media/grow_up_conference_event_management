import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'sonner';
import { Camera, X, CheckCircle, User, Building2, Mail, Phone } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add custom styling for the scanner
    const style = document.createElement('style');
    style.innerHTML = `
      #qr-reader {
        border: none !important;
      }
      #qr-reader__dashboard_section {
        display: none !important;
      }
      #qr-reader__camera_selection {
        margin-bottom: 20px !important;
      }
      #qr-reader video {
        border-radius: 12px !important;
        max-width: 100% !important;
        height: auto !important;
      }
      #qr-reader__scan_region {
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
      document.head.removeChild(style);
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    setScannedContact(null);

    // Wait for React to render the qr-reader div before initializing scanner
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10,
          qrbox: { width: 350, height: 350 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          formatsToSupport: [0] // QR_CODE
        },
        false
      );

      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('=== QR CODE SCAN DEBUG ===');
    console.log('Raw scanned data:', decodedText);
    console.log('Data length:', decodedText.length);
    console.log('First 100 chars:', decodedText.substring(0, 100));
    console.log('========================');
    
    // Extract contact ID from URL - handle multiple formats
    let contactId = null;
    
    // Try different URL patterns
    if (decodedText.includes('/contact/')) {
      // Format: https://eventpass-32.preview.emergentagent.com/contact/{contact_id}
      const parts = decodedText.split('/contact/');
      const rawId = parts[1];
      // Clean up: remove query params, hash, trailing slashes, whitespace
      contactId = rawId.split('?')[0].split('#')[0].split('/')[0].trim();
      console.log('✓ Extracted contact ID from URL:', contactId);
    } else if (decodedText.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
      // Direct UUID format (anywhere in the string)
      const match = decodedText.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      contactId = match ? match[1] : null;
      console.log('✓ Extracted UUID:', contactId);
    }
    
    if (!contactId) {
      console.error('✗ Could not extract contact ID');
      // Show first 200 characters in the error for debugging
      const preview = decodedText.length > 200 ? decodedText.substring(0, 200) + '...' : decodedText;
      toast.error(`Unable to parse QR code. Data: ${preview}`);
      return;
    }

    console.log('→ Fetching contact with ID:', contactId);

    try {
      // Fetch contact details
      const response = await axios.get(`${API}/public/contact/${contactId}`);
      console.log('✓ Contact found:', response.data.name);
      setScannedContact(response.data);
      stopScanning();
      
      // Save as lead
      try {
        await axios.post(`${API}/leads`, {
          contact_id: contactId,
          event_id: response.data.event_id,
          notes: null
        });
        console.log('✓ Lead saved');
      } catch (leadError) {
        console.error('Failed to save lead:', leadError);
        // Don't show error to user, contact was still scanned successfully
      }
      
      toast.success('Contact scanned and saved to My Leads!');
    } catch (error) {
      console.error('✗ Failed to fetch contact:', error);
      toast.error(`Contact not found with ID: ${contactId}`);
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore routine scanning errors
    if (!errorMessage.includes('NotFoundException')) {
      console.error('QR Scan error:', errorMessage);
    }
  };

  const resetScanner = () => {
    setScannedContact(null);
    startScanning();
  };

  const viewFullProfile = () => {
    if (scannedContact) {
      window.open(`/contact/${scannedContact.contact_id}`, '_blank');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      attendee: 'bg-blue-100 text-blue-700 border-blue-200',
      speaker: 'bg-purple-100 text-purple-700 border-purple-200',
      exhibitor: 'bg-green-100 text-green-700 border-green-200',
      sponsor: 'bg-amber-100 text-amber-700 border-amber-200',
      vip: 'bg-red-100 text-red-700 border-red-200',
      media: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <>
      {scanning ? (
        // Full-screen scanner mode
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-slate-800 px-4 py-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <Camera className="text-white" size={24} />
              <div>
                <h3 className="text-white font-semibold">Scanning Mode</h3>
                <p className="text-slate-300 text-xs">Position QR code in frame</p>
              </div>
            </div>
            <Button
              onClick={stopScanning}
              data-testid="stop-scanning-button"
              variant="destructive"
              size="lg"
            >
              <X size={20} className="mr-2" />
              Exit
            </Button>
          </div>

          {/* Scanner */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-2xl">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden shadow-2xl"></div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start space-x-3 text-slate-300 text-sm">
                <Camera className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-medium text-white mb-1">Scanning Tips:</p>
                  <ul className="space-y-1 text-slate-400 text-xs">
                    <li>• Hold steady and ensure good lighting</li>
                    <li>• Center the QR code in the scanning area</li>
                    <li>• Contact will be saved automatically when detected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : scannedContact ? (
        // Scanned result (full-screen)
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 to-green-600 z-50 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-white">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle size={64} />
                  </div>
                  <h3 className="text-3xl font-bold text-center">Contact Scanned!</h3>
                  <p className="text-center text-emerald-100 mt-2">Saved to your leads</p>
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-slate-900 mb-1">{scannedContact.name}</h4>
                      {scannedContact.title && (
                        <p className="text-lg text-slate-600">{scannedContact.title}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(scannedContact.type)}`}>
                      {scannedContact.type.charAt(0).toUpperCase() + scannedContact.type.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    {scannedContact.company && (
                      <div className="flex items-start space-x-3">
                        <Building2 className="text-slate-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-600">Company</p>
                          <p className="text-base font-semibold text-slate-900">{scannedContact.company}</p>
                        </div>
                      </div>
                    )}

                    {scannedContact.email && (
                      <div className="flex items-start space-x-3">
                        <Mail className="text-slate-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-600">Email</p>
                          <a 
                            href={`mailto:${scannedContact.email}`}
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-700 break-all"
                          >
                            {scannedContact.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {scannedContact.phone && (
                      <div className="flex items-start space-x-3">
                        <Phone className="text-slate-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-600">Phone</p>
                          <a 
                            href={`tel:${scannedContact.phone}`}
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            {scannedContact.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {scannedContact.booth_number && (
                      <div className="flex items-start space-x-3">
                        <User className="text-slate-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-slate-600">Booth Number</p>
                          <p className="text-base font-semibold text-slate-900">{scannedContact.booth_number}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={resetScanner}
                      data-testid="scan-another-button"
                      className="flex-1"
                      size="lg"
                    >
                      <Camera size={20} className="mr-2" />
                      Scan Another
                    </Button>
                    <Button
                      onClick={() => { setScannedContact(null); navigate('/my-leads'); }}
                      data-testid="view-all-leads-button"
                      variant="secondary"
                      className="flex-1"
                      size="lg"
                    >
                      View All Leads
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal layout with start button
        <Layout>
          <div data-testid="scanner-container" className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">QR Code Scanner</h2>
              <p className="text-slate-600 mt-1">Scan attendee badges to view contact details</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="text-indigo-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Ready to Scan</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Tap the button below to open full-screen camera and scan QR codes from attendee badges or contact cards.
              </p>
              <Button
                onClick={startScanning}
                data-testid="start-scanning-button"
                size="lg"
                className="px-8"
              >
                <Camera size={20} className="mr-2" />
                Start Full-Screen Scanning
              </Button>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};
