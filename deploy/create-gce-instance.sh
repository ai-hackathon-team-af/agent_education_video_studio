#!/bin/bash
# ===========================================
# GCE Instance Creation Script
# ===========================================
# Prerequisites: gcloud CLI installed and configured
# Usage: ./create-gce-instance.sh [instance-name] [zone]

set -e

INSTANCE_NAME=${1:-zundan-studio}
ZONE=${2:-asia-northeast1-b}
MACHINE_TYPE=${3:-e2-medium}
DISK_SIZE=${4:-50GB}

echo "======================================"
echo "Creating GCE Instance"
echo "======================================"
echo "Instance Name: $INSTANCE_NAME"
echo "Zone: $ZONE"
echo "Machine Type: $MACHINE_TYPE"
echo "Disk Size: $DISK_SIZE"
echo ""

# Create firewall rule if not exists
echo "[1/3] Creating firewall rules..."
gcloud compute firewall-rules describe allow-zundan-http 2>/dev/null || \
gcloud compute firewall-rules create allow-zundan-http \
    --allow=tcp:80,tcp:443 \
    --target-tags=http-server \
    --description="Allow HTTP/HTTPS traffic for Zundan Studio"

# Create instance
echo "[2/3] Creating GCE instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-ssd \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server \
    --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y git curl'

# Get external IP
echo "[3/3] Getting instance details..."
sleep 10
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "======================================"
echo "Instance created successfully!"
echo "======================================"
echo ""
echo "External IP: $EXTERNAL_IP"
echo ""
echo "Next steps:"
echo "1. SSH into the instance:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "2. Run the setup script:"
echo "   curl -sSL https://raw.githubusercontent.com/<your-repo>/main/deploy/setup-server.sh | bash"
echo ""
echo "3. After setup, access the application at:"
echo "   http://$EXTERNAL_IP"
echo ""
