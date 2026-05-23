Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-24.04"

  # ── vagrant-hostmanager ────────────────────────────────────────────────────
  # Keeps /etc/hosts in sync on the host machine and on every VM so that
  # hostnames (frontend, marketplace, product, achievement, infra) resolve
  # to their private network IPs automatically.
  #
  # Install the plugin once on your host before running `vagrant up`:
  #   vagrant plugin install vagrant-hostmanager
  #
  config.hostmanager.enabled      = true   # update /etc/hosts on every VM
  config.hostmanager.manage_host  = true   # also update the host machine
  config.hostmanager.manage_guest = true   # update every guest VM
  config.hostmanager.ignore_private_ip = false
  config.hostmanager.include_offline   = false

  # ── infra VM ───────────────────────────────────────────────────────────────
  # MySQL 8, MongoDB 7, Redis 7, RabbitMQ 3
  config.vm.define "infra" do |m|
    m.vm.hostname = "infra"
    m.vm.network "private_network", ip: "192.168.56.14"
    m.vm.provider "virtualbox" do |v|
      v.name   = "kidzcart-infra"
      v.memory = 2048
      v.cpus   = 2
    end
    m.vm.provision "shell", path: "provision/infra.sh"
  end

  # ── marketplace VM ─────────────────────────────────────────────────────────
  # Java 21, Maven, Tomcat 10 (port 4001)
  config.vm.define "marketplace" do |m|
    m.vm.hostname = "marketplace"
    m.vm.network "private_network", ip: "192.168.56.11"
    m.vm.provider "virtualbox" do |v|
      v.name   = "kidzcart-marketplace"
      v.memory = 1024
      v.cpus   = 1
    end
    m.vm.provision "shell", path: "provision/marketplace.sh"
  end

  # ── product VM ─────────────────────────────────────────────────────────────
  # Node.js 20 LTS, PM2
  config.vm.define "product" do |m|
    m.vm.hostname = "product"
    m.vm.network "private_network", ip: "192.168.56.12"
    m.vm.provider "virtualbox" do |v|
      v.name   = "kidzcart-product"
      v.memory = 768
      v.cpus   = 1
    end
    m.vm.provision "shell", path: "provision/product.sh"
  end

  # ── achievement VM ─────────────────────────────────────────────────────────
  # .NET 8 SDK, Nginx (reverse proxy for Kestrel on port 4006)
  config.vm.define "achievement" do |m|
    m.vm.hostname = "achievement"
    m.vm.network "private_network", ip: "192.168.56.13"
    m.vm.provider "virtualbox" do |v|
      v.name   = "kidzcart-achievement"
      v.memory = 512
      v.cpus   = 1
    end
    m.vm.provision "shell", path: "provision/achievement.sh"
  end

  # ── frontend VM ────────────────────────────────────────────────────────────
  # Node.js 20 LTS, Nginx (serves Angular dist + API proxy rules)
  config.vm.define "frontend" do |m|
    m.vm.hostname = "frontend"
    m.vm.network "private_network", ip: "192.168.56.10"
    m.vm.provider "virtualbox" do |v|
      v.name   = "kidzcart-frontend"
      v.memory = 512
      v.cpus   = 1
    end
    m.vm.provision "shell", path: "provision/frontend.sh"
  end

end
