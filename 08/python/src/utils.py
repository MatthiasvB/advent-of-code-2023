from typing import List, Dict, Tuple
from math import gcd
from functools import reduce

class LeftRight:
    def __init__(self, L: str, R: str):
        self.L = L
        self.R = R

class Itertool:
    def __init__(self, fullRangeTarget: int, endInZAfter: int, nextZ: int):
        self.fullRangeTarget = fullRangeTarget
        self.endInZAfter = endInZAfter
        self.nextZ = nextZ

class PowerWalker:
    def __init__(self, walkInstructions: str, leftRightMap: Dict[str, LeftRight]):
        self.walkInstructions = walkInstructions
        self.leftRightMap = leftRightMap
        self.strToNumber = {key: index for index, key in enumerate(leftRightMap.keys())}
        self.itertools = self.get_iter_tools()
    
    def walk_by_jump_map(self) -> int:
        jump_map = self.get_jump_map()
        steps = 0
        currents = [self.strToNumber[current] for current in self.get_all_locations_matching("A$")]

        last = steps
        
        while not self.have_same_z_distance(currents):
            max_z_distance = self.max_z_distance(currents)
            full_length_jumps = max_z_distance // len(self.walkInstructions)
            if full_length_jumps == 0:
                print("stuck!")
            steps += full_length_jumps * len(self.walkInstructions)

            if steps - last > 50_000_000_000:
                last = steps
                print(f"Now at {steps}")
            
            for i in range(len(currents)):
                currents[i] = jump_map[currents[i]][full_length_jumps]
        
        return steps + self.itertools[currents[0]].endInZAfter
    
    def get_jump_map(self) -> List[List[int]]:
        all_keys = list(self.leftRightMap.keys())
        all_distances_to_z = [self.walk_from_to(key, "Z$") for key in all_keys]
        
        max_distance = max(all_distances_to_z)
        max_jumpable_distance = max_distance - (max_distance % len(self.walkInstructions))
        
        jump_map = []
        for key in all_keys:
            jump_list = [0]
            current = key
            for i in range(max_jumpable_distance):
                next_key = self.leftRightMap[current].__dict__[self.walkInstructions[i % len(self.walkInstructions)]]
                if (i + 1) % len(self.walkInstructions) == 0:
                    jump_list.append(self.strToNumber[next_key])
                current = next_key
            jump_map.append(jump_list)
        
        return jump_map
    
    def have_same_z_distance(self, currents: List[int]) -> bool:
        z_distance0 = self.itertools[currents[0]].endInZAfter
        for i in range(1, len(currents)):
            if self.itertools[currents[i]].endInZAfter != z_distance0:
                return False
        return True
    
    def max_z_distance(self, currents: List[int]) -> int:
        return max(self.itertools[current].nextZ for current in currents)
    
    def get_iter_tools(self) -> List[Itertool]:
        return [
            Itertool(
                self.target_after_full_lr_range(key),
                self.walk_from_to(key, "Z$"),
                self.walk_from_to(key, "Z$", True)
            )
            for key in self.leftRightMap.keys()
        ]
    
    def target_after_full_lr_range(self, from_key: str) -> int:
        current = from_key
        for char in self.walkInstructions:
            next_key = self.leftRightMap[current].__dict__[char]
            current = next_key
        return self.strToNumber[current]
    
    def get_all_locations_matching(self, pattern: str) -> List[str]:
        import re
        return [key for key in self.leftRightMap.keys() if re.search(pattern, key)]
    
    def walk_from_to(self, from_key: str, to_pattern: str, force_walk=False) -> int:
        import re
        current = from_key
        steps = 0
        while not re.search(to_pattern, current) or (force_walk and steps == 0):
            next_key = self.leftRightMap[current].__dict__[self.walkInstructions[steps % len(self.walkInstructions)]]
            current = next_key
            steps += 1
        return steps

def parse_challenge(input_str: str) -> PowerWalker:
    import re
    sections = input_str.strip().split("\n\n")
    walk_instructions = sections[0]
    raw_map = sections[1].split("\n")
    
    map_parser = re.compile(r"^([A-Z0-9]{3}) = \(([A-Z0-9]{3}), ([A-Z0-9]{3})\)$")
    left_right_map = {}
    
    for line in raw_map:
        match = map_parser.match(line)
        if match:
            key, left, right = match.groups()
            left_right_map[key] = LeftRight(left, right)
    
    return PowerWalker(walk_instructions, left_right_map)

def solve(walker: PowerWalker) -> int:
    return walker.walk_by_jump_map()
