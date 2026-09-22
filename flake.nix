{
  description = "Registry of OpenSpec schemas in the wild";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;

        nodejs = pkgs.nodejs_22;

        # buildNpmPackage needs the hash of the fetched npm dependencies. It
        # cannot be known before package-lock.json exists, so it is kept in a
        # file: create nix/npm-deps-hash.txt once the lock file lands, and
        # `nix flake check` will tell you the hash it expected.
        npmDepsHashFile = ./nix/npm-deps-hash.txt;
        npmDepsHash =
          if builtins.pathExists npmDepsHashFile
          then lib.strings.trim (builtins.readFile npmDepsHashFile)
          else lib.fakeHash;

        hasNodeProject = builtins.pathExists ./package-lock.json;

        # The gate /mip:ship documents: >=70% line coverage overall and >=80%
        # on core packages (anything under src/core/).
        coverageGate = ''
          if [ ! -f coverage/coverage-summary.json ]; then
            echo "gate: coverage/coverage-summary.json is missing." >&2
            echo "gate: the coverage script must write a json-summary report." >&2
            exit 1
          fi

          overall=$(${pkgs.jq}/bin/jq -r '.total.lines.pct' coverage/coverage-summary.json)
          echo "gate: overall line coverage ''${overall}% (minimum 70%)"
          ${pkgs.jq}/bin/jq -e '.total.lines.pct >= 70' coverage/coverage-summary.json > /dev/null || {
            echo "gate: overall line coverage ''${overall}% is below 70%" >&2
            exit 1
          }

          core=$(${pkgs.jq}/bin/jq -r '
            [to_entries[] | select(.key | test("/src/core/")) | .value.lines]
            | if length == 0 then null
              else (map(.covered) | add) / (map(.total) | add) * 100
              end
          ' coverage/coverage-summary.json)

          if [ "$core" = "null" ]; then
            echo "gate: no files under src/core/, core threshold not applicable"
          else
            echo "gate: core line coverage ''${core}% (minimum 80%)"
            ${pkgs.jq}/bin/jq -e '
              [to_entries[] | select(.key | test("/src/core/")) | .value.lines]
              | (map(.covered) | add) / (map(.total) | add) * 100 >= 80
            ' coverage/coverage-summary.json > /dev/null || {
              echo "gate: core line coverage ''${core}% is below 80%" >&2
              exit 1
            }
          fi
        '';

        notScaffolded = pkgs.runCommand "openspec-schema-registry-gate" { } ''
          echo "gate: this project has no package-lock.json yet." >&2
          echo "gate: build, tests and the coverage gate cannot run, so the gate fails." >&2
          echo "gate: scaffold the npm project (package.json, tsconfig.json," >&2
          echo "gate: vitest config, src/, tests), run npm install, then record the" >&2
          echo "gate: npm deps hash in nix/npm-deps-hash.txt." >&2
          exit 1
        '';

        registry = pkgs.buildNpmPackage {
          pname = "openspec-schema-registry";
          version = "0.1.0";
          src = ./.;
          inherit npmDepsHash nodejs;

          # npm test and the coverage run happen in checkPhase below.
          dontNpmBuild = false;

          doCheck = true;
          checkPhase = ''
            runHook preCheck

            echo "==> npm test"
            npm test

            echo "==> npm run coverage"
            npm run coverage

            ${coverageGate}

            runHook postCheck
          '';
        };

        # The registry file itself must always be valid JSON, whatever the
        # state of the npm project around it.
        registryJson = pkgs.runCommand "openspec-schemas-json-valid"
          { nativeBuildInputs = [ pkgs.jq ]; } ''
          src=${./.}/openspec-schemas.json
          if [ ! -f "$src" ]; then
            echo "gate: openspec-schemas.json does not exist yet" >&2
            exit 1
          fi
          jq empty "$src"
          echo "gate: openspec-schemas.json parses"
          touch $out
        '';
      in
      {
        packages.default = if hasNodeProject then registry else notScaffolded;

        checks = {
          registry-json = registryJson;
          build-test-coverage = if hasNodeProject then registry else notScaffolded;
        };

        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            pkgs.jq
            pkgs.check-jsonschema
          ];

          shellHook = ''
            echo "openspec-schema-registry dev shell"
            echo "  node $(node --version)"
          '';
        };
      });
}
