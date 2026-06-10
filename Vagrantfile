Vagrant.configure("2") do |config|
  # ── Architecture detection ─────────────────────────────────────────────────
  # On Apple Silicon the host CPU will report "arm64" / "arm64e".
  # On AMD64 Windows/Linux/Intel Mac it reports "x86_64".
  IS_ARM = RbConfig::CONFIG["host_cpu"].downcase.start_with?("arm")

  # ── Box selection ──────────────────────────────────────────────────────────
  # bento/ubuntu-24.04 ships both amd64 and arm64 variants; Vagrant + the
  # provider will pull the correct one automatically, so one box name works
  # for both platforms.
  config.vm.box = "bento/ubuntu-24.04"

  # ── vagrant-hostmanager ────────────────────────────────────────────────────
  # Keeps /etc/hosts in sync on the host machine and on every VM so that
  # hostnames (frontend, marketplace, product, achievement, infra) resolve
  # to their private network IPs automatically.
  #
  # Install the required plugin(s) once on your host before running `vagrant up`:
  #   AMD64  →  vagrant plugin install vagrant-hostmanager
  #   ARM64  →  vagrant plugin install vagrant-hostmanager
  #             (VMware provider ships with Vagrant VMware Utility – install
  #              the utility and the plugin separately; see HashiCorp docs)
  #
  config.hostmanager.enabled           = true
  config.hostmanager.manage_host       = true
  config.hostmanager.manage_guest      = true
  config.hostmanager.ignore_private_ip = false
  config.hostmanager.include_offline   = false

  # ── Helper: apply provider block to a VM definition ───────────────────────
  # Keeps the per-VM blocks DRY – call set_provider.(node, name, memory, cpus)
  set_provider = lambda do |node, vm_name, memory, cpus|
    if IS_ARM
      node.vm.provider "vmware_desktop" do |v|
        v.gui    = false
        v.vmx["displayName"] = "kidzcart-#{vm_name}"
        v.memory = memory
        v.cpus   = cpus
        # Required so VMware Fusion/Desktop runs a native ARM guest
        v.vmx["guestOS"] = "arm-ubuntu-64"
      end
    else
      node.vm.provider "virtualbox" do |v|
        v.name   = "kidzcart-#{vm_name}"
        v.memory = memory
        v.cpus   = cpus
      end
    end
  end

  # ── infra VM ───────────────────────────────────────────────────────────────
  # MySQL 8, MongoDB 7, Redis 7, RabbitMQ 3
  config.vm.define "infra" do |m|
    m.vm.hostname = "infra"
    m.vm.network "private_network", ip: "192.168.56.14"
    set_provider.(m, "infra", 2048, 2)
    m.vm.provision "shell", path: "provision/infra.sh"
  end

  # ── marketplace VM ─────────────────────────────────────────────────────────
  # Java 21, Maven, Tomcat 10 (port 4001)
  config.vm.define "marketplace" do |m|
    m.vm.hostname = "marketplace"
    m.vm.network "private_network", ip: "192.168.56.11"
    set_provider.(m, "marketplace", 1024, 1)
    m.vm.provision "shell", path: "provision/marketplace.sh"
  end

  # ── product VM ─────────────────────────────────────────────────────────────
  # Node.js 20 LTS, PM2
  config.vm.define "product" do |m|
    m.vm.hostname = "product"
    m.vm.network "private_network", ip: "192.168.56.12"
    set_provider.(m, "product", 768, 1)
    m.vm.provision "shell", path: "provision/product.sh"
  end

  # ── achievement VM ─────────────────────────────────────────────────────────
  # .NET 8 SDK, Nginx (reverse proxy for Kestrel on port 4006)
  config.vm.define "achievement" do |m|
    m.vm.hostname = "achievement"
    m.vm.network "private_network", ip: "192.168.56.13"
    set_provider.(m, "achievement", 512, 1)
    m.vm.provision "shell", path: "provision/achievement.sh"
  end

  # ── frontend VM ────────────────────────────────────────────────────────────
  # Node.js 20 LTS, Nginx (serves Angular dist + API proxy rules)
  config.vm.define "frontend" do |m|
    m.vm.hostname = "frontend"
    m.vm.network "private_network", ip: "192.168.56.10"
    set_provider.(m, "frontend", 512, 1)
    m.vm.provision "shell", path: "provision/frontend.sh"
  end

end
