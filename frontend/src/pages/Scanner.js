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
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    setScannedContact(null);

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR Code scanned:', decodedText);
    
    // Extract contact ID from URL
    // Expected format: https://eventpass-32.preview.emergentagent.com/contact/{contact_id}
    let contactId = null;
    
    if (decodedText.includes('/contact/')) {
      const parts = decodedText.split('/contact/');
      contactId = parts[1];
    } else {
      toast.error('Invalid QR code format');
      return;
    }

    if (contactId) {
      try {
        // Fetch contact details
        const response = await axios.get(`${API}/public/contact/${contactId}`);
        setScannedContact(response.data);
        stopScanning();
        toast.success('Contact scanned successfully!');
      } catch (error) {
        console.error('Failed to fetch contact:', error);
        toast.error('Failed to load contact details');
      }
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
    <Layout>
      <div data-testid="scanner-container" className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">QR Code Scanner</h2>
          <p className="text-slate-600 mt-1">Scan attendee badges to view contact details</p>
        </div>

        {!scanning && !scannedContact && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="text-indigo-600" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Ready to Scan</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Click the button below to activate your camera and scan QR codes from attendee badges or contact cards.
            </p>
            <Button
              onClick={startScanning}
              data-testid="start-scanning-button"
              size="lg"
              className="px-8"
            >
              <Camera size={20} className="mr-2" />
              Start Scanning
            </Button>
          </div>
        )}

        {scanning && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Scanning...</h3>
              <Button
                onClick={stopScanning}
                data-testid="stop-scanning-button"
                variant="secondary"
                size="sm"
              >
                <X size={16} className="mr-2" />
                Stop
              </Button>
            </div>
            <div id="qr-reader" className="w-full"></div>
            <p className="text-sm text-slate-600 text-center mt-4">
              Position the QR code within the camera view
            </p>
          </div>
        )}

        {scannedContact && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-2xl font-bold text-center">Contact Scanned!</h3>
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
                        className="text-base font-semibold text-indigo-600 hover:text-indigo-700"
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

              <div className="flex space-x-4">
                <Button
                  onClick={viewFullProfile}
                  data-testid="view-full-profile-button"
                  className="flex-1"
                >
                  View Full Profile
                </Button>
                <Button
                  onClick={resetScanner}
                  data-testid="scan-another-button"
                  variant="secondary"
                  className="flex-1"
                >
                  <Camera size={18} className="mr-2" />
                  Scan Another
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
